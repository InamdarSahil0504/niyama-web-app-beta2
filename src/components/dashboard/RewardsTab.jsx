import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { TIER_CONFIG, getEffectiveTier, getMemberMonths } from '../../config'

const GIFT_CARD_BRANDS = [
  { name:'Amazon',     icon:'📦' },
  { name:'Target',     icon:'🎯' },
  { name:'Starbucks',  icon:'☕' },
  { name:'Walmart',    icon:'🛒' },
  { name:'Whole Foods',icon:'🥗' },
  { name:'Nike',       icon:'👟' },
  { name:'Sephora',    icon:'💄' },
  { name:'Apple',      icon:'🍎' },
  { name:'Uber Eats',  icon:'🍔' },
  { name:'Google Play',icon:'🎮' },
]

export default function RewardsTab({ session, profile, isMinor }) {
  const [rewards, setRewards]   = useState([])
  const [loading, setLoading]   = useState(true)

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

  // ── Tier & reward info ─────────────────────────────────────────────────────
  const effectiveTier    = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const tierConfig       = TIER_CONFIG[effectiveTier]
  const memberMonths     = getMemberMonths(profile?.created_at)
  const isFreeTrial      = effectiveTier === 'free_trial'
  const isFreeExpired    = effectiveTier === 'free_expired'
  const isFree           = isFreeTrial || isFreeExpired
  const trialMonthsLeft  = Math.max(3 - memberMonths, 0)

  const successfulDays   = profile?.successful_days || 0
  const monthlyPoints    = profile?.monthly_points  || 0
  const minDays          = tierConfig?.min_days || 0
  const isInactive       = (profile?.consecutive_inactive_days || 0) >= 5
  const isEligible       = minDays > 0 && successfulDays >= minDays && !isInactive && !isMinor

  // Progressive reward calculation
  const baseReward       = Math.min(monthlyPoints / 1000, tierConfig?.reward_cap || 0)
  const milestones       = tierConfig?.milestones || {}
  let unlockedBonus      = 0
  if (milestones.days_10_bonus  && successfulDays >= 10) unlockedBonus += milestones.days_10_bonus
  if (milestones.days_20_bonus  && successfulDays >= 20) unlockedBonus += milestones.days_20_bonus
  const estimatedReward  = isEligible ? Math.min(baseReward + unlockedBonus, tierConfig?.max_cap || tierConfig?.reward_cap || 0) : 0
  const maxCap           = tierConfig?.max_cap || tierConfig?.reward_cap || 0

  // Current month
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const currentRewardRow = rewards.find(r => r.month === currentMonth)

  // Milestone steps
  const milestoneSteps = []
  if (minDays > 0) {
    milestoneSteps.push({ days: minDays, label: 'Reward eligibility', bonus: null, type: 'eligibility' })
  }
  if (milestones.days_10_bonus) {
    milestoneSteps.push({ days: 10, label: '10-day milestone', bonus: milestones.days_10_bonus, type: 'bonus' })
  }
  if (milestones.days_20_bonus) {
    milestoneSteps.push({ days: 20, label: '20-day milestone', bonus: milestones.days_20_bonus, type: 'bonus' })
  }
  if (milestones.successful_month_bonus) {
    milestoneSteps.push({ days: null, label: 'Successful month', bonus: milestones.successful_month_bonus, type: 'special' })
  }
  if (milestones.perfect_month_bonus) {
    milestoneSteps.push({ days: null, label: 'Perfect month', bonus: milestones.perfect_month_bonus, type: 'gold' })
  }

  const card = {
    background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
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
          Gift cards delivered on the 1st of each month
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
            You've completed your 3-month free trial. Upgrade to keep earning real financial rewards every month.
          </p>
          <button
            onClick={() => window.open('https://niyamalife.com/pricing', '_blank')}
            style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'12px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'14px' }}>
            View pricing — starts at $0.99/mo →
          </button>
        </div>
      )}

      {/* This month's reward */}
      {!isFreeExpired && !isMinor && (
        <div style={card}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
            <div>
              <p style={{ fontSize:'13px', color:'var(--theme-text-secondary)', marginBottom:'4px' }}>
                {now.toLocaleString('default', { month:'long', year:'numeric' })}
              </p>
              <h2 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)' }}>This month's reward</h2>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:'32px', fontWeight:'800', color:'var(--theme-primary)', lineHeight:1 }}>
                ${estimatedReward.toFixed(2)}
              </p>
              <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginTop:'2px' }}>
                of ${maxCap.toFixed(2)} max
              </p>
            </div>
          </div>

          {/* Eligibility status */}
          {isInactive ? (
            <div style={{ background:'#fef2f2', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
              <p style={{ fontSize:'13px', color:'#dc2626', fontWeight:'600' }}>⚠️ Ineligible — 5+ consecutive inactive days</p>
              <p style={{ fontSize:'12px', color:'#dc2626', marginTop:'2px', lineHeight:'1.4' }}>Submit your habits to restore eligibility.</p>
            </div>
          ) : !isEligible ? (
            <div style={{ background:'var(--theme-primary-light)', borderRadius:'10px', padding:'12px', marginBottom:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                <p style={{ fontSize:'13px', color:'var(--theme-primary)', fontWeight:'600' }}>
                  {minDays - successfulDays} more successful {minDays-successfulDays===1?'day':'days'} needed
                </p>
                <p style={{ fontSize:'12px', color:'var(--theme-primary)', fontWeight:'700' }}>{successfulDays}/{minDays}</p>
              </div>
              <div style={{ background:'rgba(0,0,0,0.08)', borderRadius:'4px', height:'6px' }}>
                <div style={{ background:'var(--theme-primary)', borderRadius:'4px', height:'6px', width:`${Math.min((successfulDays/minDays)*100,100)}%`, transition:'width 0.3s' }} />
              </div>
            </div>
          ) : (
            <div style={{ background:'var(--theme-primary-light)', borderRadius:'10px', padding:'12px', marginBottom:'14px', display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'20px' }}>✅</span>
              <div>
                <p style={{ fontSize:'13px', color:'var(--theme-primary)', fontWeight:'700' }}>Eligible for rewards this month</p>
                <p style={{ fontSize:'11px', color:'var(--theme-text-secondary)', marginTop:'1px' }}>Keep going — you're on track for your gift card.</p>
              </div>
            </div>
          )}

          {/* Points progress */}
          <div style={{ marginBottom:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontSize:'12px', color:'var(--theme-text-secondary)' }}>Points this month</span>
              <span style={{ fontSize:'12px', fontWeight:'700', color:'var(--theme-text)' }}>{monthlyPoints.toLocaleString()} pts</span>
            </div>
            <div style={{ background:'var(--theme-primary-light)', borderRadius:'4px', height:'8px' }}>
              <div style={{ background:'var(--theme-primary)', borderRadius:'4px', height:'8px', width:`${Math.min((monthlyPoints/22500)*100,100)}%`, transition:'width 0.3s' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'3px' }}>
              <span style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>0</span>
              <span style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>22,500 max</span>
            </div>
          </div>

          {/* Reward breakdown */}
          <div style={{ borderTop:'1px solid var(--theme-border)', paddingTop:'14px' }}>
            {[
              { label:'Base reward', value:`$${baseReward.toFixed(2)}`, muted: false },
              ...(milestones.days_10_bonus ? [{ label:'10-day bonus', value:`+$${milestones.days_10_bonus.toFixed(2)}`, unlocked: successfulDays>=10 }] : []),
              ...(milestones.days_20_bonus ? [{ label:'20-day bonus', value:`+$${milestones.days_20_bonus.toFixed(2)}`, unlocked: successfulDays>=20 }] : []),
              ...(milestones.successful_month_bonus ? [{ label:'Successful month bonus', value:`+$${milestones.successful_month_bonus.toFixed(2)}`, special: true }] : []),
              ...(milestones.perfect_month_bonus ? [{ label:'Perfect month bonus', value:`+$${milestones.perfect_month_bonus.toFixed(2)}`, gold: true }] : []),
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  {item.gold && <span style={{ fontSize:'12px' }}>🏆</span>}
                  {item.special && !item.gold && <span style={{ fontSize:'12px' }}>🌟</span>}
                  <span style={{ fontSize:'13px', color: item.unlocked===false?'var(--theme-text-muted)':'var(--theme-text-secondary)' }}>
                    {item.label}
                  </span>
                </div>
                <span style={{ fontSize:'13px', fontWeight:'600', color: item.unlocked===false?'var(--theme-text-muted)':item.gold?'#C9973A':'var(--theme-primary)' }}>
                  {item.value}
                  {item.unlocked===false && <span style={{ fontSize:'10px', marginLeft:'4px' }}>🔒</span>}
                  {item.unlocked===true && <span style={{ fontSize:'10px', marginLeft:'4px' }}>✓</span>}
                </span>
              </div>
            ))}
            <div style={{ borderTop:'1px solid var(--theme-border)', paddingTop:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:'14px', fontWeight:'700', color:'var(--theme-text)' }}>Estimated total</span>
              <span style={{ fontSize:'18px', fontWeight:'800', color:'var(--theme-primary)' }}>${estimatedReward.toFixed(2)}</span>
            </div>
          </div>

          {/* Beta notice */}
          <div style={{ background:'#fffbeb', borderRadius:'8px', padding:'10px 12px', marginTop:'12px' }}>
            <p style={{ fontSize:'11px', color:'#92400e', lineHeight:'1.5' }}>
              🧪 <strong>Beta:</strong> Rewards are tracked but not yet paid out. Gift card delivery activates at full launch.
            </p>
          </div>
        </div>
      )}

      {/* Free trial context */}
      {isFreeTrial && !isMinor && (
        <div style={{ background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)', borderRadius:'12px', padding:'14px 16px', marginBottom:'16px' }}>
          <p style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-primary)', marginBottom:'4px' }}>
            🎁 {trialMonthsLeft} month{trialMonthsLeft!==1?'s':''} left in your free trial
          </p>
          <p style={{ fontSize:'12px', color:'var(--theme-text-secondary)', lineHeight:'1.5' }}>
            After your trial, upgrade to Basic for $0.99/month to keep earning rewards up to $5.00/month.
          </p>
        </div>
      )}

      {/* Gift card brands */}
      <div style={card}>
        <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'4px' }}>Your gift card</h3>
        <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', marginBottom:'14px' }}>
          Choose from 10 top brands — delivered to your email on the 1st of each month.
        </p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:'8px' }}>
          {GIFT_CARD_BRANDS.map(brand => (
            <div key={brand.name} style={{ background:'var(--theme-primary-light)', borderRadius:'10px', padding:'10px 4px', textAlign:'center' }}>
              <p style={{ fontSize:'20px', marginBottom:'3px' }}>{brand.icon}</p>
              <p style={{ fontSize:'9px', color:'var(--theme-text-secondary)', fontWeight:'600', lineHeight:'1.2' }}>{brand.name}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginTop:'10px', textAlign:'center' }}>
          Gift card selection available at launch
        </p>
      </div>

      {/* Reward history */}
      {rewards.length > 0 && (
        <div style={card}>
          <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'14px' }}>Reward history</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {rewards.map(r => {
              const monthDate  = new Date(r.month + '-01')
              const monthLabel = monthDate.toLocaleString('default', { month:'long', year:'numeric' })
              const isRedeemed = r.redeemed
              const isCurrent  = r.month === currentMonth

              return (
                <div key={r.id} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'12px 14px', borderRadius:'12px',
                  background: isCurrent ? 'var(--theme-primary-light)' : 'var(--theme-bg)',
                  border: `1px solid ${isCurrent ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                }}>
                  <div>
                    <p style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'2px' }}>
                      {monthLabel} {isCurrent && <span style={{ fontSize:'10px', background:'var(--theme-primary)', color:'white', padding:'1px 6px', borderRadius:'8px', marginLeft:'4px' }}>Current</span>}
                    </p>
                    <p style={{ fontSize:'11px', color:'var(--theme-text-muted)' }}>
                      {(r.points_earned || 0).toLocaleString()} pts
                      {r.cap_utilisation > 0 && ` · ${r.cap_utilisation}% of cap used`}
                    </p>
                    {r.tremendous_id && (
                      <p style={{ fontSize:'10px', color:'var(--theme-text-muted)', marginTop:'2px', fontFamily:'monospace' }}>
                        ID: {r.tremendous_id}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'16px', fontWeight:'800', color: (r.reward_value||0)>0?'var(--theme-primary)':'var(--theme-text-muted)' }}>
                      ${(r.reward_value || 0).toFixed(2)}
                    </p>
                    <div style={{ marginTop:'4px' }}>
                      {isCurrent ? (
                        <span style={{ fontSize:'10px', color:'var(--theme-primary)', fontWeight:'600' }}>In progress</span>
                      ) : isRedeemed ? (
                        <span style={{ fontSize:'10px', color:'var(--theme-primary)', fontWeight:'600' }}>✓ Delivered</span>
                      ) : (r.reward_value || 0) === 0 ? (
                        <span style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>Not eligible</span>
                      ) : (
                        <span style={{ fontSize:'10px', color:'#C9973A', fontWeight:'600' }}>Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upgrade CTA for basic */}
      {effectiveTier === 'basic' && (
        <div style={{ ...card, background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)' }}>
          <p style={{ fontSize:'14px', fontWeight:'700', color:'var(--theme-primary)', marginBottom:'6px' }}>Unlock milestone bonuses</p>
          <p style={{ fontSize:'13px', color:'var(--theme-text-secondary)', lineHeight:'1.6', marginBottom:'12px' }}>
            Upgrade to Plus to earn bonus rewards at 20 days and for a successful month — up to $17.50/month total.
          </p>
          <button
            onClick={() => window.open('https://niyamalife.com/pricing', '_blank')}
            style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'12px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'14px' }}>
            Upgrade to Plus — $4.99/mo →
          </button>
        </div>
      )}

      {/* How rewards work */}
      <div style={card}>
        <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'14px' }}>How rewards work</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[
            { icon:'📊', title:'Earn points daily', desc:'Complete your habits each day to earn up to 750 points.' },
            { icon:'📅', title:'Hit your minimum days', desc:`Reach ${minDays || 10} successful days this month to qualify for your reward.` },
            { icon:'🎁', title:'Gift card on the 1st', desc:'Your reward is automatically delivered as a gift card on the 1st of each month.' },
            { icon:'🔒', title:'No cash transfers', desc:'All rewards are electronic gift cards only — Amazon, Starbucks, Nike, and more.' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
              <span style={{ fontSize:'20px', flexShrink:0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'2px' }}>{item.title}</p>
                <p style={{ fontSize:'12px', color:'var(--theme-text-secondary)', lineHeight:'1.4' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
