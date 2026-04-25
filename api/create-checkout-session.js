import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const { tier, billing, userId, userEmail, successUrl, cancelUrl } = req.body
const PRICE_IDS = {
  basic_monthly: 'price_1TPaBo9crPKLFCMF39E116lA',
  basic_annual: 'price_1TPaBo9crPKLFCMFNkXgFJUF',
  plus_monthly: 'price_1TPaD49crPKLFCMF22QHLlq1',
  plus_annual: 'price_1TPaD49crPKLFCMFiYXkQpz0',
  premium_monthly: 'price_1TPaE09crPKLFCMFaFzsnPrn',
  premium_annual: 'price_1TPaE09crPKLFCMFIgphzKgO',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { tier, billing, userId, userEmail } = req.body

  if (!tier || !billing || !userId || !userEmail) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const priceKey = `${tier}_${billing}`
  const priceId = PRICE_IDS[priceKey]

  if (!priceId) {
    return res.status(400).json({ error: `Unknown plan: ${priceKey}` })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: userEmail,
      client_reference_id: userId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || 'https://app.niyamalife.com?checkout=success',
      cancel_url: cancelUrl || 'https://app.niyamalife.com/settings',
      subscription_data: {
        metadata: { userId, tier, billing }
      },
      metadata: { userId, tier, billing }
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: err.message })
  }
}
