import { useState } from 'react'

export default function MovementPreference({ onContinue }) {
  const [selected, setSelected] = useState(null)

  const options = [
    {
      key: 'steps',
      icon: '👟',
      title: 'Steps',
      description: 'Track your daily step count. Tiered scoring: 5,000 steps = 50pts, 7,500 = 75pts, 10,000 = 100pts.',
      note: 'Best for: walkers, commuters, anyone with a phone in their pocket.',
    },
    {
      key: 'activity',
      icon: '🏃',
      title: 'Physical activity',
      description: 'Track 30 minutes of active heart rate exercise. Any workout counts — running, gym, cycling, swimming.',
      note: 'Best for: people who train intensely but may not rack up step counts.',
    },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px', margin:'0 auto', flex:1, display:'flex', flexDirection:'column' }}>

        <ProgressBar step={7} total={11} />

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>

          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <h2 style={{ fontSize:'28px', fontWeight:'800', color:'var(--theme-text)', letterSpacing:'-0.02em', marginBottom:'8px' }}>
              How do you move?
            </h2>
            <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)', lineHeight:'1.6' }}>
              Choose how you want to track your movement habit. You can switch this anytime in Settings.
            </p>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'32px' }}>
            {options.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSelected(opt.key)}
                style={{
                  background: selected===opt.key ? 'var(--theme-primary)' : 'var(--theme-card)',
                  border: `2px solid ${selected===opt.key ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                  borderRadius:'16px',
                  padding:'20px',
                  cursor:'pointer',
                  textAlign:'left',
                  transition:'all 0.15s ease',
                }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                  <span style={{ fontSize:'28px' }}>{opt.icon}</span>
                  <p style={{ fontSize:'17px', fontWeight:'700', color: selected===opt.key?'white':'var(--theme-text)' }}>
                    {opt.title}
                  </p>
                  {selected===opt.key && (
                    <span style={{ marginLeft:'auto', fontSize:'18px' }}>✓</span>
                  )}
                </div>
                <p style={{ fontSize:'13px', color: selected===opt.key?'rgba(255,255,255,0.85)':'var(--theme-text-secondary)', lineHeight:'1.5', marginBottom:'8px' }}>
                  {opt.description}
                </p>
                <p style={{ fontSize:'11px', color: selected===opt.key?'rgba(255,255,255,0.7)':'var(--theme-text-muted)', lineHeight:'1.4', fontStyle:'italic' }}>
                  {opt.note}
                </p>
              </button>
            ))}
          </div>

          <div style={{ background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)', borderRadius:'12px', padding:'14px 16px' }}>
            <p style={{ fontSize:'12px', color:'var(--theme-primary)', lineHeight:'1.6' }}>
              💡 Both options are tracked automatically via Apple Health or Google Fit in the native app. For now, you'll log this manually in the web app.
            </p>
          </div>
        </div>

        <button
          onClick={() => selected && onContinue(selected)}
          disabled={!selected}
          style={{ width:'100%', background: selected?'var(--theme-primary)':'var(--theme-border)', color: selected?'white':'var(--theme-text-muted)', fontWeight:'700', padding:'14px', borderRadius:'10px', border:'none', cursor: selected?'pointer':'not-allowed', fontSize:'15px', marginTop:'32px', transition:'all 0.15s' }}>
          {selected ? `Continue with ${selected === 'steps' ? 'steps' : 'physical activity'} →` : 'Select an option'}
        </button>
      </div>
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
