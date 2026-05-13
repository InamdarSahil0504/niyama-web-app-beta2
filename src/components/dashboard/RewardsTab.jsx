import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { TIER_CONFIG, getEffectiveTier, getMemberMonths } from '../../config'

const GIFT_CARD_BRANDS = [
  { name: 'Amazon',      icon: '📦', color: '#FF9900' },
  { name: 'Starbucks',   icon: '☕', color: '#00704A' },
  { name: 'Nike',        icon: '👟', color: '#111111' },
  { name: 'Apple',       icon: '🍎', color: '#555555' },
  { name: 'Target',      icon: '🎯', color: '#CC0000' },
  { name: 'Walmart',     icon: '🛒', color: '#0071CE' },
  { name: 'Whole Foods', icon: '🥗', color: '#00674B' },
  { name: 'Sephora',     icon: '💄', color: '#E2062C' },
  { name: 'Uber Eats',   icon: '🍔', color: '#06C167' },
  { name: 'Google Play', icon: '🎮', color: '#4285F4' },
]

// Phase 6 milestone values (used as display fallback if config doesn't have them)
const PHASE6_MILESTONES = {
  plus: {
    days_20_bonus: 2.50,
    successful_month_bonus: 5.00,
    perfect_month_bonus: 7.50,
    max: 17.50,
  },
  premium: {
    days_10_bonus: 2.50,
    days_20_bonus: 5.00,
    successful_month_bonus: 7.50,
    perfect_month_bonus: 10.00,
    max: 35.00,
  },
}

export default function RewardsTab({ session, profile, isMinor }) {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)

  const userId = session.user.id

  useEffect(() => { fetchRewards() }, [])

  async function fetchRewards() {
    setLoading(true)
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_id', userId)
      .order('month', { ascending: false })
    setRewards(data || [])
    setLoading(false)
  }

  const effectiveTier  = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const tierConfig     = TIER_CONFIG[effectiveTier]
  const memberMonths   = getMemberMonths(profile?.created_at)
  const isFreeTrial    = effectiveTier === 'free_trial'
  const isFreeExpired  = effectiveTier === 'free_expired'
  const trialMonthsLeft = Math.max(3 - memberMonths, 0)

  const successfulDays = profile?.successful_days || 0
  const monthlyPoints  = profile?.monthly_points  || 0
  const minDays        = tierConfig?.min_days      || 0
  const isInactive     = (profile?.consecutive_inactive_days || 0) >= 5
  const isEligible     = minDays > 0 && successfulDays >= minDays && !isInactive && !isMinor

  const milestones    = tierConfig?.milestones || {}
  const baseReward    = Math.min(monthlyPoints / 1000, tierConfig?.reward_cap || 0)
  let unlockedBonus   = 0
  if (milestones.days_10_bonus && successfulDays >= 10) unlockedBonus += milestones.days_10_bonus
  if (milestones.days_20_bonus && successfulDays >= 20) unlockedBonus += milestones.days_20_bonus
  const maxCap          = tierConfig?.max_cap || tierConfig?.reward_cap || 0
  const estimatedReward = isEligible ? Math.min(baseReward + unlockedBonus, maxCap) : 0

  const now          = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`

  // Days until next payout (1st of next month)
  const nextPayout   = new Date(now.getFullYear(), now.getMonth()+1, 1)
  const daysLeft     = Math.ceil((nextPayout - now) / (1000*60*60*24))

  // 30-day account age gate
  const accountCreatedAt = profile?.created_at ? new Date(profile.created_at) : null
  const firstRewardDate = accountCreatedAt ? new Date(accountCreatedAt) : null
  if (firstRewardDate) firstRewardDate.setDate(firstRewardDate.getDate() + 30)
  const isInAgeGate = firstRewardDate && now < firstRewardDate

  const firstRewardDateFormatted = firstRewardDate
    ? firstRewardDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  const card = {
    background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'80px' }}>
      <div style={{ width:'28px', height:'28px', border:'3px solid var(--theme-primary)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:'20px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'4px' }}>Rewards</h1>
        <p style={{ fontSize:'13px', color:'var(--theme-text-muted)' }}>
          Real gift cards, delivered automatically
        </p>
      </div>

      {/* Minor notice */}
      {isMinor && (
        <div style={{ ...card, background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)' }}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:'var(--theme-primary)', marginBottom:'4px' }}>Rewards available at 18</p>
          <p style={{ fontSize:'13px', color:'var(--theme-text-secondary)', lineHeight:'1.5' }}>
            You're building great habits. Your rewards will be waiting when you turn 18.
          </p>
        </div>
      )}

      {/* Free expired */}
      {isFreeExpired && !isMinor && (
        <div style={{ ...card, background:'#fffbeb', border:'1px solid #fcd34d' }}>
          <p style={{ fontSize:'14px', fontWeight:'700', color:'#92400e', marginBottom:'6px' }}>Your free trial has ended</p>
          <p style={{ fontSize:'13px', color:'#78350f', lineHeight:'1.6', marginBottom:'12px' }}>
            Upgrade to keep earning real financial rewards every month.
          </p>
          <button onClick={() => window.open('https://niyamalife.com/pricing', '_blank')}
            style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'12px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'14px' }}>
            View pricing — starts at $0.99/mo
          </button>
        </div>
      )}

      {/* 30-day age gate banner */}
      {isInAgeGate && !isFreeExpired && !isMinor && (
        <div style={{
          background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
          borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontSize: '20px' }}>🔒</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text)', margin: '0 0 2px' }}>
              Your first reward unlocks on {firstRewardDateFormatted}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', margin: 0 }}>
              Keep logging habits to maximize your first payout.
            </p>
          </div>
        </div>
      )}

      {/* Hero reward card */}
      {!isFreeExpired && !isMinor && (
        <div style={{
          background: 'linear-gradient(135deg, #3D6B5A 0%, #4A7A68 60%, #5A8A78 100%)',
          borderRadius: '20px', padding: '24px', marginBottom: '16px', color: 'white',
          boxShadow: '0 4px 20px rgba(74,122,104,0.35)', position: 'relative', overflow: 'hidden',
          opacity: isInAgeGate ? 0.7 : 1,
          transition: 'opacity 0.3s',
        }}>
          {/* Gold glow for eligible users */}
          {isEligible && !isInAgeGate && (
            <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'150px', height:'150px', borderRadius:'50%', background:'rgba(201,151,58,0.15)', filter:'blur(30px)', pointerEvents:'none' }} />
          )}

          {/* Payout countdown */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' }}>
            <div>
              <p style={{ fontSize:'11px', opacity:'0.7', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'6px' }}>
                {now.toLocaleString('default', { month:'long', year:'numeric' })}
              </p>
              <p style={{ fontSize:'13px', opacity:'0.85', marginBottom:'4px' }}>Your reward this month</p>
              <p style={{
                fontSize:'48px', fontWeight:'900', lineHeight:1, letterSpacing:'-0.02em',
                opacity: isInAgeGate ? 0.6 : 1,
                filter: isInAgeGate ? 'blur(4px)' : 'none',
                transition: 'opacity 0.3s, filter 0.3s',
                userSelect: isInAgeGate ? 'none' : 'auto',
              }}>
                ${estimatedReward.toFixed(2)}
              </p>
              <p style={{ fontSize:'12px', opacity:'0.6', marginTop:'4px' }}>of ${maxCap.toFixed(2)} possible</p>
            </div>
            <div style={{ textAlign:'center', background:'rgba(255,255,255,0.12)', borderRadius:'14px', padding:'12px 16px' }}>
              <p style={{ fontSize:'28px', fontWeight:'900', lineHeight:1 }}>{daysLeft}</p>
              <p style={{ fontSize:'10px', opacity:'0.8', marginTop:'3px' }}>days to</p>
              <p style={{ fontSize:'10px', opacity:'0.8' }}>payout</p>
            </div>
          </div>

          {/* Eligibility / progress */}
          {isInactive ? (
            <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'12px 14px', marginBottom:'16px' }}>
              <p style={{ fontSize:'13px', fontWeight:'600' }}>⚠️ Ineligible this month</p>
              <p style={{ fontSize:'11px', opacity:'0.8', marginTop:'2px' }}>5+ consecutive inactive days. Submit your habits to restore eligibility.</p>
            </div>
          ) : isInAgeGate ? (
            <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'12px 14px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'20px' }}>🔒</span>
              <p style={{ fontSize:'13px', fontWeight:'600', margin: 0 }}>Unlocks {firstRewardDateFormatted}</p>
            </div>
          ) : isEligible ? (
            <div style={{ background:'rgba(255,255,255,0.12)', borderRadius:'12px', padding:'12px 14px', marginBottom:'16px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'22px' }}>🎁</span>
              <div>
                <p style={{ fontSize:'13px', fontWeight:'700' }}>You're eligible for your gift card!</p>
                <p style={{ fontSize:'11px', opacity:'0.8', marginTop:'2px' }}>Delivered to your email on the 1st.</p>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom:'16px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <p style={{ fontSize:'13px', fontWeight:'600', opacity:'0.9' }}>
                  {minDays - successfulDays} more successful {minDays - successfulDays===1?'day':'days'} to unlock
                </p>
                <p style={{ fontSize:'12px', fontWeight:'700', opacity:'0.9' }}>{successfulDays}/{minDays}</p>
              </div>
              <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'6px', height:'8px' }}>
                <div style={{ background:'white', borderRadius:'6px', height:'8px', width:`${Math.min((successfulDays/minDays)*100,100)}%`, transition:'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Reward breakdown */}
          <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:'12px', padding:'14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <span style={{ fontSize:'12px', opacity:'0.8' }}>Base reward</span>
              <span style={{ fontSize:'13px', fontWeight:'700' }}>${baseReward.toFixed(2)}</span>
            </div>
            {(milestones.days_10_bonus || (effectiveTier === 'premium' && PHASE6_MILESTONES.premium.days_10_bonus)) && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', opacity:successfulDays>=10?1:0.45 }}>
                <span style={{ fontSize:'12px' }}>{successfulDays>=10?'✓':''} 10-day bonus</span>
                <span style={{ fontSize:'13px', fontWeight:'700' }}>+${(milestones.days_10_bonus || PHASE6_MILESTONES.premium.days_10_bonus || 0).toFixed(2)}</span>
              </div>
            )}
            {(milestones.days_20_bonus || PHASE6_MILESTONES[effectiveTier]?.days_20_bonus) && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', opacity:successfulDays>=20?1:0.45 }}>
                <span style={{ fontSize:'12px' }}>{successfulDays>=20?'✓':''} 20-day bonus</span>
                <span style={{ fontSize:'13px', fontWeight:'700' }}>+${(milestones.days_20_bonus || PHASE6_MILESTONES[effectiveTier]?.days_20_bonus || 0).toFixed(2)}</span>
              </div>
            )}
            {(milestones.successful_month_bonus || PHASE6_MILESTONES[effectiveTier]?.successful_month_bonus) && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', opacity:0.45 }}>
                <span style={{ fontSize:'12px' }}>🌟 Successful month</span>
                <span style={{ fontSize:'13px', fontWeight:'700' }}>+${(milestones.successful_month_bonus || PHASE6_MILESTONES[effectiveTier]?.successful_month_bonus || 0).toFixed(2)}</span>
              </div>
            )}
            {(milestones.perfect_month_bonus || PHASE6_MILESTONES[effectiveTier]?.perfect_month_bonus) && (
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', opacity:0.45 }}>
                <span style={{ fontSize:'12px' }}>🏆 Perfect month</span>
                <span style={{ fontSize:'13px', fontWeight:'700', color:'#C9973A' }}>+${(milestones.perfect_month_bonus || PHASE6_MILESTONES[effectiveTier]?.perfect_month_bonus || 0).toFixed(2)}</span>
              </div>
            )}
            <div style={{ borderTop:'1px solid rgba(255,255,255,0.2)', paddingTop:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'13px', fontWeight:'700' }}>Total this month</span>
              <span style={{ fontSize:'18px', fontWeight:'900' }}>${estimatedReward.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Free trial banner */}
      {isFreeTrial && !isMinor && (
        <div style={{ background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)', borderRadius:'12px', padding:'14px 16px', marginBottom:'16px' }}>
          <p style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-primary)', marginBottom:'4px' }}>
            🎁 {trialMonthsLeft} month{trialMonthsLeft!==1?'s':''} left in your free trial
          </p>
          <p style={{ fontSize:'12px', color:'var(--theme-text-secondary)', lineHeight:'1.5' }}>
            After your trial, upgrade to Basic for $0.99/month to keep earning rewards.
          </p>
        </div>
      )}

      {/* Upgrade CTA for basic */}
      {effectiveTier === 'basic' && (
        <div style={{ ...card, background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)' }}>
          <p style={{ fontSize:'14px', fontWeight:'700', color:'var(--theme-primary)', marginBottom:'6px' }}>Unlock milestone bonuses</p>
          <p style={{ fontSize:'13px', color:'var(--theme-text-secondary)', lineHeight:'1.6', marginBottom:'12px' }}>
            Upgrade to Plus — earn $2.50 bonus at 20 days and $5.00 for a successful month. Up to $17.50/month.
          </p>
          <button onClick={() => window.open('https://niyamalife.com/pricing', '_blank')}
            style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'12px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'14px' }}>
            Upgrade to Plus — $4.99/mo
          </button>
        </div>
      )}

      {/* Upgrade CTA for plus */}
      {effectiveTier === 'plus' && (
        <div style={{ ...card, background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)' }}>
          <p style={{ fontSize:'14px', fontWeight:'700', color:'var(--theme-primary)', marginBottom:'6px' }}>Go Premium for more</p>
          <p style={{ fontSize:'13px', color:'var(--theme-text-secondary)', lineHeight:'1.6', marginBottom:'12px' }}>
            Premium unlocks a 10-day bonus ($2.50), larger milestone bonuses, and up to $35.00/month in rewards.
          </p>
          <button onClick={() => window.open('https://niyamalife.com/pricing', '_blank')}
            style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'12px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'14px' }}>
            Upgrade to Premium — $9.99/mo
          </button>
        </div>
      )}

      {/* Gift card catalog */}
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
          <div>
            <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'2px' }}>Choose your gift card</h3>
            <p style={{ fontSize:'12px', color:'var(--theme-text-muted)' }}>10 top brands — pick your favorite at redemption</p>
          </div>
          <div style={{ background:'var(--theme-primary-light)', borderRadius:'8px', padding:'4px 10px' }}>
            <p style={{ fontSize:'10px', fontWeight:'700', color:'var(--theme-primary)' }}>via Tremendous</p>
          </div>
        </div>

        {/* Brand grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'8px', marginBottom:'12px' }}>
          {GIFT_CARD_BRANDS.map(brand => (
            <div key={brand.name} style={{
              background: 'var(--theme-bg)', border:'1px solid var(--theme-border)',
              borderRadius:'12px', padding:'10px 4px', textAlign:'center',
              transition:'transform 0.15s',
            }}>
              <p style={{ fontSize:'24px', marginBottom:'4px', lineHeight:1 }}>{brand.icon}</p>
              <p style={{ fontSize:'9px', color:'var(--theme-text-secondary)', fontWeight:'600', lineHeight:'1.2' }}>{brand.name}</p>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--theme-primary-light)', borderRadius:'10px', padding:'10px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'16px' }}>✉️</span>
          <p style={{ fontSize:'12px', color:'var(--theme-primary)', lineHeight:'1.5' }}>
            <strong>Delivered instantly to your email</strong> on the 1st of each month. No account needed — just click and redeem.
          </p>
        </div>
      </div>

      {/* Reward history */}
      {rewards.length > 0 && (
        <div style={card}>
          <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'14px' }}>Reward history</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {rewards.map(r => {
              const monthLabel = new Date(r.month+'-01').toLocaleString('default', { month:'long', year:'numeric' })
              const isCurrent  = r.month === currentMonth
              const isDelivered = r.redeemed || r.delivered

              return (
                <div key={r.id} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'12px 14px', borderRadius:'12px',
                  background: isCurrent ? 'var(--theme-primary-light)' : 'var(--theme-bg)',
                  border: `1px solid ${isCurrent ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
                      <p style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text)' }}>{monthLabel}</p>
                      {isCurrent && <span style={{ fontSize:'10px', background:'var(--theme-primary)', color:'white', padding:'1px 6px', borderRadius:'8px' }}>Current</span>}
                    </div>
                    <p style={{ fontSize:'11px', color:'var(--theme-text-muted)' }}>
                      {(r.points_earned||0).toLocaleString()} pts
                      {r.cap_utilisation>0 && ` · ${r.cap_utilisation}% of cap`}
                    </p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'16px', fontWeight:'800', color:(r.reward_value||0)>0?'var(--theme-primary)':'var(--theme-text-muted)' }}>
                      ${(r.reward_value||0).toFixed(2)}
                    </p>
                    <p style={{ fontSize:'10px', marginTop:'3px', fontWeight:'600', color: isCurrent?'var(--theme-primary)':isDelivered?'var(--theme-primary)':(r.reward_value||0)===0?'var(--theme-text-muted)':'#C9973A' }}>
                      {isCurrent ? 'In progress' : isDelivered ? '✓ Delivered' : (r.reward_value||0)===0 ? 'Not eligible' : 'Pending'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty history state */}
      {rewards.length === 0 && !isFreeExpired && !isMinor && (
        <div style={{ ...card, textAlign:'center', padding:'28px 20px' }}>
          <p style={{ fontSize:'32px', marginBottom:'12px' }}>🗓️</p>
          <p style={{ fontSize:'14px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'6px' }}>No rewards yet</p>
          <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', lineHeight:'1.6' }}>
            Your first gift card will appear here after the 1st of next month, once you've hit your minimum successful days.
          </p>
        </div>
      )}
    </div>
  )
}
