import { useState } from 'react'

export default function NotificationsSetup({ onContinue }) {
  const [pushEnabled, setPushEnabled]       = useState(false)
  const [middayNudge, setMiddayNudge]       = useState(true)
  const [streakProtection, setStreakProtection] = useState(true)
  const [requesting, setRequesting]         = useState(false)

  async function requestPermission() {
    if (!('Notification' in window)) {
      onContinue({ pushEnabled: false, middayNudge, streakProtection })
      return
    }
    setRequesting(true)
    const permission = await Notification.requestPermission()
    setPushEnabled(permission === 'granted')
    setRequesting(false)
  }

  function handleContinue() {
    onContinue({ pushEnabled, middayNudge, streakProtection })
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px', margin:'0 auto', flex:1, display:'flex', flexDirection:'column' }}>

        <ProgressBar step={10} total={11} />

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>

          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <div style={{ width:'80px', height:'80px', background:'#f0f4ff', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <span style={{ fontSize:'40px' }}>🔔</span>
            </div>
            <h2 style={{ fontSize:'28px', fontWeight:'800', color:'var(--theme-text)', letterSpacing:'-0.02em', marginBottom:'8px' }}>
              Stay on track
            </h2>
            <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)', lineHeight:'1.6' }}>
              Notifications help you build the habit of tracking. Enable them to get gentle reminders and streak protection.
            </p>
          </div>

          {/* Main toggle */}
          <div style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'16px', padding:'20px', marginBottom:'12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
              <div>
                <p style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'2px' }}>Enable notifications</p>
                <p style={{ fontSize:'12px', color:'var(--theme-text-muted)' }}>Wake alerts, evening reviews, gift card delivery</p>
              </div>
              <button
                onClick={pushEnabled ? undefined : requestPermission}
                disabled={requesting}
                style={{
                  background: pushEnabled ? 'var(--theme-primary)' : 'var(--theme-border)',
                  border: 'none', borderRadius:'20px', padding:'6px 16px',
                  cursor: pushEnabled ? 'default' : 'pointer',
                  color: pushEnabled ? 'white' : 'var(--theme-text-muted)',
                  fontSize:'13px', fontWeight:'600', flexShrink:0,
                  transition:'all 0.15s',
                }}>
                {requesting ? 'Requesting...' : pushEnabled ? '✓ Enabled' : 'Enable'}
              </button>
            </div>
          </div>

          {/* Sub-options — only shown if push enabled */}
          {pushEnabled && (
            <div style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'16px', padding:'20px', marginBottom:'12px' }}>
              <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>
                Optional notifications
              </p>

              <ToggleRow
                icon="🤖"
                title="Midday AI nudge"
                description="A personalised reminder at noon based on your incomplete habits. Powered by Claude AI."
                checked={middayNudge}
                onChange={setMiddayNudge}
              />
              <div style={{ borderTop:'1px solid var(--theme-border)', margin:'14px 0' }} />
              <ToggleRow
                icon="🛡️"
                title="Streak protection"
                description="A reminder at 10pm if you haven't submitted your habits yet."
                checked={streakProtection}
                onChange={setStreakProtection}
              />
            </div>
          )}

          {/* What you'll always get */}
          <div style={{ background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)', borderRadius:'12px', padding:'14px 16px' }}>
            <p style={{ fontSize:'12px', color:'var(--theme-primary)', lineHeight:'1.6' }}>
              🎁 <strong>Always on:</strong> Gift card delivery notifications and free trial expiry reminders are sent by email regardless of this setting.
            </p>
          </div>
        </div>

        <button onClick={handleContinue}
          style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'14px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'15px', marginTop:'32px', marginBottom:'12px' }}>
          {pushEnabled ? 'Continue →' : 'Continue without notifications →'}
        </button>
      </div>
    </div>
  )
}

function ToggleRow({ icon, title, description, checked, onChange }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
      <span style={{ fontSize:'18px', flexShrink:0, marginTop:'2px' }}>{icon}</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:'14px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'2px' }}>{title}</p>
        <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', lineHeight:'1.4' }}>{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer',
          background: checked ? 'var(--theme-primary)' : 'var(--theme-border)',
          position:'relative', flexShrink:0, transition:'background 0.15s',
        }}
      >
        <div style={{
          width:'18px', height:'18px', borderRadius:'50%', background:'white',
          position:'absolute', top:'3px',
          left: checked ? '23px' : '3px',
          transition:'left 0.15s',
          boxShadow:'0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
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
