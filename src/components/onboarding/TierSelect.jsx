import { useState } from 'react'
import { supabase } from '../../supabase'
import { trackEvent } from '../../config'

const TIERS = [
  {
    key: 'free',
    name: 'Free',
    monthlyPrice: '$0',
    annualPrice: null,
    priceNote: 'forever',
    maxCap: '$2.50',
    capNote: 'first 3 months only',
    badge: null,
    description: 'Full app access, earn rewards for 3 months',
    minDays: 10,
    customSlots: 0,
    features: [
      '3 core + 4 library habits (9 total)',
      'Streak tracking and analytics',
      'No credit card required',
      'Earn up to $2.50/mo for first 3 months',
      'After 3 months — full access, no rewards',
    ],
  },
  {
    key: 'basic',
    name: 'Basic',
    monthlyPrice: '$0.99',
    annualPrice: '$9.99',
    annualSaving: '$1.89',
    priceNote: '/month',
    maxCap: '$5.00',
    capNote: 'per month',
    badge: null,
    description: 'Start earning real rewards',
    minDays: 10,
    customSlots: 1,
    features: [
      'Everything in Free',
      '1 custom habit slot',
      'Up to $5.00 reward per month',
      'Qualify with 10 successful days',
    ],
  },
  {
    key: 'plus',
    name: 'Plus',
    monthlyPrice: '$4.99',
    annualPrice: '$49.99',
    annualSaving: '$9.89',
    priceNote: '/month',
    maxCap: '$17.50',
    capNote: 'with bonuses',
    badge: 'Popular',
    badgeBg: 'var(--theme-primary-light)',
    badgeColor: 'var(--theme-primary)',
    description: 'Milestone bonuses unlock more rewards',
    minDays: 7,
    customSlots: 2,
    features: [
      'Everything in Basic',
      '2 custom habit slots',
      'Base reward up to $10.00/mo',
      '+$2.50 at 20 successful days',
      '+$5.00 for a successful month',
      'Max $17.50/mo total',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    monthlyPrice: '$14.99',
    annualPrice: '$149.99',
    annualSaving: '$29.89',
    priceNote: '/month',
    maxCap: '$45.00',
    capNote: 'with all bonuses',
    badge: 'Best value',
    badgeBg: 'var(--theme-secondary-light)',
    badgeColor: 'var(--theme-secondary)',
    description: 'Maximum rewards + perfect month bonus',
    minDays: 5,
    customSlots: 2,
    features: [
      'Everything in Plus',
      'Base reward up to $22.50/mo',
      '+$2.50 at 10 days, +$5.00 at 20 days',
      '+$7.50 for a successful month',
      '+$7.50 for a perfect month',
      'Max $45.00/mo total',
    ],
  },
]

export default function TierSelect({ userId, onContinue, onBack }) {
  const [selected, setSelected] = useState(null)
  const [billing, setBilling] = useState('monthly')
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [message, setMessage] = useState('')

  function showMessage(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  async function confirmTier() {
    if (!selected || saving) return

    // Free tier — save and continue normally
    if (selected === 'free') {
      setSaving(true)
      await supabase.from('profiles')
        .update({ tier: 'free', tier_chosen: true })
        .eq('id', userId)
      trackEvent(supabase, userId, 'tier_selected', { tier: 'free', billing })
      onComplete('free')
      setSaving(false)
      return
    }

    // Paid tier — redirect to Stripe checkout
    setSaving(true)
    try {
      trackEvent(supabase, userId, 'tier_selected', { tier: selected, billing })
      await supabase.from('profiles')
        .update({ tier: selected, tier_chosen: true })
        .eq('id', userId)

      localStorage.setItem('niyama_onboarding_tier', selected)
      localStorage.setItem('niyama_onboarding_billing', billing)
      localStorage.setItem('niyama_onboarding_pending', 'true')
      localStorage.setItem('niyama_onboarding_step', 'tier-select')

      const { data: { user } } = await supabase.auth.getUser()
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selected,
          billing,
          userId,
          userEmail: user?.email,
          successUrl: `${window.location.origin}?onboarding=continue`,
          cancelUrl: `${window.location.origin}?onboarding=tier`,
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        showMessage('Could not start checkout. Please try again.')
        setSaving(false)
      }
    } catch (e) {
      showMessage('Could not start checkout. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', padding: '32px 24px 96px' }}>
      {/* Back button */}
      {onBack && (
        <button onClick={onBack} style={{
          position: 'absolute', top: '24px', left: '24px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', color: 'var(--theme-text-muted)',
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px',
        }}>
          ← Back
        </button>
      )}
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>

        <ProgressBar step={5} total={11} />

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Choose your plan
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.5' }}>
            Start free. Upgrade anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
          {['monthly', 'annual'].map(b => (
            <button key={b} onClick={() => setBilling(b)}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: billing === b ? 'var(--theme-primary)' : 'transparent',
                color: billing === b ? 'white' : 'var(--theme-text-muted)',
                fontWeight: billing === b ? '700' : '400',
                fontSize: '13px', transition: 'all 0.15s',
              }}>
              {b === 'monthly' ? 'Monthly' : 'Annual'}
              {b === 'annual' && (
                <span style={{ marginLeft: '6px', fontSize: '11px', background: billing === 'annual' ? 'rgba(255,255,255,0.2)' : 'var(--theme-primary-light)', color: billing === 'annual' ? 'white' : 'var(--theme-primary)', padding: '1px 6px', borderRadius: '8px', fontWeight: '600' }}>
                  Save up to $30
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tier cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {TIERS.map(tier => {
            const isSelected = selected === tier.key
            const isExpanded = expanded === tier.key
            const price = billing === 'annual' && tier.annualPrice ? tier.annualPrice : tier.monthlyPrice
            const priceNote = billing === 'annual' && tier.annualPrice ? '/year' : tier.priceNote

            return (
              <div key={tier.key} style={{
                background: isSelected ? 'var(--theme-primary-light)' : 'var(--theme-card)',
                border: `${isSelected ? '2px' : '1px'} solid ${isSelected ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                borderRadius: '16px', overflow: 'hidden', transition: 'all 0.15s',
              }}>
                <button onClick={() => { setSelected(tier.key); setExpanded(isExpanded ? null : tier.key) }}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '16px 20px', textAlign: 'left' }}>

                  {tier.badge && (
                    <span style={{ background: tier.badgeBg, color: tier.badgeColor, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '8px' }}>
                      {tier.badge}
                    </span>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)', marginBottom: '2px' }}>{tier.name}</p>
                      <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)' }}>{tier.description}</p>
                      {tier.customSlots > 0 && (
                        <p style={{ fontSize: '11px', color: 'var(--theme-primary)', marginTop: '4px', fontWeight: '600' }}>
                          {tier.customSlots} custom habit {tier.customSlots === 1 ? 'slot' : 'slots'}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                      <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--theme-text)', lineHeight: 1 }}>{price}</p>
                      <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>{priceNote}</p>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-primary)', marginTop: '4px' }}>
                        Up to {tier.maxCap}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>{tier.capNote}</p>
                      {billing === 'annual' && tier.annualSaving && (
                        <p style={{ fontSize: '10px', color: 'var(--theme-primary)', fontWeight: '600', marginTop: '2px' }}>
                          Save {tier.annualSaving}/yr
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--theme-primary)' }}>✓</span>
                      <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-primary)' }}>Selected</p>
                    </div>
                  )}
                </button>

                {/* Expanded features */}
                {isExpanded && (
                  <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--theme-border)' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', marginTop: '12px' }}>
                      What's included
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {tier.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: 'var(--theme-primary)', fontSize: '12px', flexShrink: 0, marginTop: '1px' }}>✓</span>
                          <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.4' }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '10px' }}>
                      Min. {tier.minDays} successful days/month to qualify for rewards.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pricing link */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button onClick={() => window.open('https://www.niyamalife.com/pricing', '_blank')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--theme-primary)', fontWeight: '600', textDecoration: 'underline' }}>
            View full pricing details ↗
          </button>
        </div>

        {/* Error message */}
        {message && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
            <p style={{ fontSize: '13px', color: '#dc2626' }}>{message}</p>
          </div>
        )}

        {/* Confirm button */}
        <button onClick={confirmTier} disabled={!selected || saving}
          style={{
            width: '100%', fontWeight: '700', padding: '14px', borderRadius: '10px',
            fontSize: '15px', border: 'none', transition: 'all 0.2s',
            background: selected ? 'var(--theme-primary)' : 'var(--theme-border)',
            color: selected ? 'white' : 'var(--theme-text-muted)',
            cursor: selected ? 'pointer' : 'not-allowed',
          }}>
          {saving ? 'Please wait...' : selected
            ? (selected === 'free' ? 'Continue with Free →' : `Subscribe to ${TIERS.find(t => t.key === selected)?.name} →`)
            : 'Select a plan to continue'}
        </button>

      </div>
    </div>
  )
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>Step {step} of {total}</span>
        <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>{Math.round((step / total) * 100)}%</span>
      </div>
      <div style={{ background: 'var(--theme-border)', borderRadius: '4px', height: '4px' }}>
        <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '4px', width: `${(step / total) * 100}%`, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}
