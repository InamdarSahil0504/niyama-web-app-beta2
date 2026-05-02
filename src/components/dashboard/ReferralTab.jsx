import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getEffectiveTier, TIER_CONFIG } from '../../config'

export default function ReferralTab({ session, profile, isMinor, streak, todaySummary, todayPoints }) {
  const [referralCode, setReferralCode] = useState(null)
  const [referrals, setReferrals] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const userId = session.user.id
  const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const isFree = effectiveTier === 'free_trial' || effectiveTier === 'free_expired'
  const tierLabel = TIER_CONFIG[effectiveTier]?.label || 'Free'

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    // Get referral code from profile
    const { data: profileData } = await supabase
      .from('profiles').select('referral_code').eq('id', userId).single()
    setReferralCode(profileData?.referral_code || null)

    // Get referrals made by this user
    const { data: referralData } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
    setReferrals(referralData || [])
    setLoading(false)
  }

  async function generateCode() {
    setGenerating(true)
    const { data, error } = await supabase.rpc('generate_referral_code', { p_user_id: userId })
    if (!error) {
      setReferralCode(data)
    }
    setGenerating(false)
  }

  function copyCode() {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    window.posthog?.capture('referral_code_copied')
  }

  function shareCode() {
    if (!referralCode) return
    const text = `Join me on Niyama — the habit app that pays you real rewards for daily discipline. Use my code ${referralCode} to get started: https://app.niyamalife.com`
    window.posthog?.capture('referral_shared', { method: navigator.share ? 'native_share' : 'clipboard' })
    if (navigator.share) {
      navigator.share({ title: 'Join Niyama', text })
    } else {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const confirmedReferrals = referrals.filter(r => r.status === 'confirmed').length
  const pendingReferrals = referrals.filter(r => r.status === 'pending').length
  const bonusEarned = confirmedReferrals * 2.50

  const card = {
    background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '28px', height: '28px', border: '3px solid var(--theme-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>Referrals</h1>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>Invite friends and earn reward bonuses</p>
      </div>

      {/* How it works */}
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>How it works</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { icon: '📤', title: 'Share your code', desc: 'Send your unique referral code to a friend.' },
            { icon: '✅', title: 'They sign up', desc: 'Your friend creates an account and selects a paid plan.' },
            { icon: '🎯', title: 'They complete a successful day', desc: 'Once they hit their first successful day, the referral is confirmed.' },
            { icon: '🎁', title: 'Both of you earn', desc: 'Your monthly reward cap increases by $2.50. So does theirs. Max 20 referrals/year.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '2px' }}>{item.title}</p>
                <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.4' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Minor gate */}
      {isMinor && (
        <div style={{ ...card, background: '#fffbeb', border: '1px solid #fcd34d' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>Referrals available at 18</p>
          <p style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.6' }}>
            You can still invite friends to Niyama, but referral bonuses are only available to users aged 18 and above.
          </p>
        </div>
      )}
      {/* Referral code */}
      {!isMinor && (
        <div style={card}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Your referral code</p>

          {referralCode ? (
            <>
              <div style={{ background: 'var(--theme-bg)', border: '2px dashed var(--theme-primary)', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '28px', fontWeight: '800', color: 'var(--theme-primary)', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
                  {referralCode}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={copyCode}
                  style={{ flex: 1, background: copied ? 'var(--theme-primary)' : 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', color: copied ? 'white' : 'var(--theme-primary)', fontWeight: '700', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
                  {copied ? '✓ Copied!' : 'Copy code'}
                </button>
                <button onClick={shareCode}
                  style={{ flex: 1, background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '11px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}>
                  {isFree && (
                    <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                      <p style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
                        🎁 <strong>Free plan:</strong> You can refer friends but won't earn referral bonuses. Upgrade to Basic or above to earn $2.50 per confirmed referral.
                      </p>
                    </div>
                  )}

                  Share →
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
                Generate your unique referral code to start inviting friends.
              </p>
              <button onClick={generateCode} disabled={generating}
                style={{ background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: generating ? 0.7 : 1 }}>
                {generating ? 'Generating...' : 'Generate my code'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {confirmedReferrals >= 0 && !isMinor && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Confirmed', value: confirmedReferrals, color: 'var(--theme-primary)' },
            { label: 'Pending', value: pendingReferrals, color: '#C9973A' },
            { label: 'Cap bonus', value: `$${bonusEarned.toFixed(2)}`, color: 'var(--theme-primary)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
              <p style={{ fontSize: '20px', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', marginTop: '3px' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Referral list */}
      {referrals.length > 0 && (
        <div style={card}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Your referrals</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {referrals.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--theme-bg)', borderRadius: '10px' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>
                    {r.referred?.full_name || 'Pending sign-up'}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '1px' }}>
                    {r.referred?.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '8px',
                  background: r.status === 'confirmed' ? 'var(--theme-primary-light)' : '#fffbeb',
                  color: r.status === 'confirmed' ? 'var(--theme-primary)' : '#92400e',
                }}>
                  {r.status === 'confirmed' ? '✓ +$2.50' : '⏳ Pending'}
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '10px', lineHeight: '1.5' }}>
            Pending = friend signed up but hasn't completed a successful day yet.
          </p>
        </div>
      )}

      {/* Empty state */}
      {referrals.length === 0 && referralCode && (
        <div style={{ ...card, textAlign: 'center', padding: '32px 20px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>👥</p>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '8px' }}>No referrals yet</p>
          <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)', lineHeight: '1.6' }}>
            Share your code above and earn $2.50 for every friend who completes their first successful day.
          </p>
        </div>
      )}

      import {SocialShareCard} from './HomeTab'
      {/* Social sharing */}
      <SocialShareCard
        session={session}
        profile={profile}
        streak={profile?.streak}
        todaySummary={null}
        todayPoints={0}
        isMinor={isMinor}
      />

      {/* Fine print */}
      <div style={{ ...card, background: 'var(--theme-bg)' }}>
        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', lineHeight: '1.6' }}>
          Max 20 referrals per year · Max $50 additional cap per year · Paid tier required · Self-referrals not allowed · Niyama may terminate the referral program at any time.
        </p>
      </div>
    </div>

  )
}
