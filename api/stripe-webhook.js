import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const supabase = createClient(
  'https://jzbqicxycryebennqyhe.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PRICE_TO_TIER = {
  'price_1TPaBo9crPKLFCMF39E116lA': { tier: 'basic',   billing: 'monthly' },
  'price_1TPaBo9crPKLFCMFNkXgFJUF': { tier: 'basic',   billing: 'annual'  },
  'price_1TPaD49crPKLFCMF22QHLlq1': { tier: 'plus',    billing: 'monthly' },
  'price_1TPaD49crPKLFCMFiYXkQpz0': { tier: 'plus',    billing: 'annual'  },
  'price_1TPaE09crPKLFCMFaFzsnPrn': { tier: 'premium', billing: 'monthly' },
  'price_1TPaE09crPKLFCMFIgphzKgO': { tier: 'premium', billing: 'annual'  },
}

// Read raw body from request stream
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig    = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  let event

  try {
    const rawBody = await getRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session    = event.data.object
        const userId     = session.client_reference_id
        const customerId = session.customer
        const subId      = session.subscription

        if (!userId) {
          console.error('No client_reference_id on session:', session.id)
          break
        }

        const subscription = await stripe.subscriptions.retrieve(subId)
        const priceId      = subscription.items.data[0]?.price?.id
        const tierInfo     = PRICE_TO_TIER[priceId]

        if (!tierInfo) {
          console.error('Unknown price ID:', priceId)
          break
        }

        await supabase.from('profiles').update({
          tier:                    tierInfo.tier,
          billing_cycle:           tierInfo.billing,
          stripe_customer_id:      customerId,
          stripe_subscription_id:  subId,
          subscription_status:     'active',
          tier_chosen:             true,
          subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
          subscription_end_date:   new Date(subscription.current_period_end   * 1000).toISOString(),
        }).eq('id', userId)

        await supabase.from('user_tier_history').insert({
          user_id:    userId,
          old_tier:   'free',
          new_tier:   tierInfo.tier,
          changed_by: 'stripe',
          reason:     `checkout.session.completed — price: ${priceId}`,
        })

        console.log(`✓ Checkout complete: user ${userId} → ${tierInfo.tier} ${tierInfo.billing}`)
        break
      }

      case 'customer.subscription.updated': {
        const sub        = event.data.object
        const priceId    = sub.items.data[0]?.price?.id
        const tierInfo   = PRICE_TO_TIER[priceId]
        const customerId = sub.customer

        if (!tierInfo) {
          console.error('Unknown price ID on update:', priceId)
          break
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, tier, billing_cycle')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('No profile found for customer:', customerId)
          break
        }

        const oldTier = profile.tier

        await supabase.from('profiles').update({
          tier:                    tierInfo.tier,
          billing_cycle:           tierInfo.billing,
          stripe_subscription_id:  sub.id,
          subscription_status:     sub.status,
          subscription_start_date: new Date(sub.current_period_start * 1000).toISOString(),
          subscription_end_date:   new Date(sub.current_period_end   * 1000).toISOString(),
        }).eq('id', profile.id)

        if (oldTier !== tierInfo.tier) {
          await supabase.from('user_tier_history').insert({
            user_id:    profile.id,
            old_tier:   oldTier,
            new_tier:   tierInfo.tier,
            changed_by: 'stripe',
            reason:     `subscription.updated — price: ${priceId}`,
          })
        }

        console.log(`✓ Subscription updated: customer ${customerId} → ${tierInfo.tier} ${tierInfo.billing}`)
        break
      }

      case 'customer.subscription.deleted': {
        const sub        = event.data.object
        const customerId = sub.customer

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, tier')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) {
          console.error('No profile found for customer:', customerId)
          break
        }

        await supabase.from('profiles').update({
          tier:                    'free',
          billing_cycle:           null,
          subscription_status:     'cancelled',
          stripe_subscription_id:  null,
          subscription_end_date:   new Date().toISOString(),
        }).eq('id', profile.id)

        await supabase.from('user_tier_history').insert({
          user_id:    profile.id,
          old_tier:   profile.tier,
          new_tier:   'free',
          changed_by: 'stripe',
          reason:     'subscription.deleted — downgraded to free',
        })

        console.log(`✓ Subscription cancelled: customer ${customerId} → free`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice    = event.data.object
        const customerId = invoice.customer

        await supabase.from('profiles').update({
          subscription_status: 'past_due',
        }).eq('stripe_customer_id', customerId)

        console.log(`⚠️ Payment failed: customer ${customerId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}

export const config = {
  api: { bodyParser: false }
}
