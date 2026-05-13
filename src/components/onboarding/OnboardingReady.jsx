import { TIER_CONFIG, getEffectiveTier } from '../../config'

export default function OnboardingReady({ profile, customHabits, wakeMinutes, onComplete }) {
  const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const tierLabel     = TIER_CONFIG[effectiveTier]?.label || 'Free'

  function minutesToLabel(mins) {
    if (!mins) return '6:30 AM'
    const h    = Math.floor(mins / 60)
    const m    = mins % 60
    const ampm = h < 12 ? 'AM' : 'PM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour}:${m.toString().padStart(2,'0')} ${ampm}`
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px', margin:'0 auto', flex:1, display:'flex', flexDirection:'column' }}>

        <ProgressBar step={9} total={9} />

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>

          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <div style={{ fontSize:'56px', marginBottom:'16px' }}>🌿</div>
            <h2 style={{ fontSize:'32px', fontWeight:'800', color:'var(--theme-text)', letterSpacing:'-0.02em', marginBottom:'8px' }}>
              You're all set,<br />{profile?.full_name?.split(' ')[0] || 'there'}!
            </h2>
            <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)', lineHeight:'1.6' }}>
              Here's your Niyama setup. Your journey starts today.
            </p>
          </div>

          {/* Setup summary */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'32px' }}>

            {/* Tier */}
            <SummaryRow icon="💎" label="Your plan" value={tierLabel} />

            {/* Region */}
            <SummaryRow
              icon="🌍"
              label="Region"
              value={profile?.region === 'india' ? '🇮🇳 India' : '🇺🇸 United States'}
            />

            {/* Wake time */}
            <SummaryRow icon="🌅" label="Wake goal" value={minutesToLabel(wakeMinutes)} />

            {/* Core habits */}
            <div style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'12px', padding:'14px 16px' }}>
              <p style={{ fontSize:'12px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
                Core habits (3)
              </p>
              {[
                { icon:'🌅', label:`Wake before ${minutesToLabel(wakeMinutes)}` },
                { icon:'📵', label:'No phone after 10:30 PM' },
                { icon:'👟', label:'Daily steps goal' },
              ].map((h,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom: i<2?'6px':'0' }}>
                  <span style={{ fontSize:'14px' }}>{h.icon}</span>
                  <span style={{ fontSize:'13px', color:'var(--theme-text)' }}>{h.label}</span>
                </div>
              ))}
            </div>

            {/* Library habits — static summary */}
            <SummaryRow icon="📚" label="Library habits" value="7 habits (fixed)" />

            {/* Custom habits */}
            {customHabits?.length > 0 ? (
              <div style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'12px', padding:'14px 16px' }}>
                <p style={{ fontSize:'12px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'10px' }}>
                  Personal habits ({customHabits.length})
                </p>
                {customHabits.map((h,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom: i<customHabits.length-1?'6px':'0' }}>
                    <span style={{ fontSize:'14px' }}>⭐</span>
                    <span style={{ fontSize:'13px', color:'var(--theme-text)' }}>{h}</span>
                  </div>
                ))}
              </div>
            ) : (
              <SummaryRow icon="⭐" label="Personal habits" value="No personal habits added" />
            )}
          </div>

          <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', textAlign:'center', lineHeight:'1.6' }}>
            You can change your habits, wake time, and preferences anytime in Settings.
          </p>
        </div>

        <button
          onClick={onComplete}
          style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'16px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'16px', marginTop:'24px' }}>
          Go to my dashboard 🌿
        </button>
      </div>
    </div>
  )
}

function SummaryRow({ icon, label, value }) {
  return (
    <div style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'12px', padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px' }}>
      <span style={{ fontSize:'18px', flexShrink:0 }}>{icon}</span>
      <span style={{ fontSize:'13px', color:'var(--theme-text-secondary)', flex:1 }}>{label}</span>
      <span style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text)' }}>{value}</span>
    </div>
  )
}

function ProgressBar({ step, total }) {
  return (
    <div style={{ marginBottom:'32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
        <span style={{ fontSize:'12px', color:'var(--theme-text-muted)' }}>Step {step} of {total}</span>
        <span style={{ fontSize:'12px', color:'var(--theme-text-muted)' }}>{Math.round((step/total)*100)}%</span>
      </div>
      <div style={{ background:'var(--theme-border)', borderRadius:'4px', height:'4px' }}>
        <div style={{ background:'var(--theme-primary)', borderRadius:'4px', height:'4px', width:`${(step/total)*100}%`, transition:'width 0.3s' }} />
      </div>
    </div>
  )
}
