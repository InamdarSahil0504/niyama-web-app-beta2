import { useState } from 'react'

export default function WakeTime({ onContinue }) {
  // Wake time stored as minutes from midnight. Default 6:30am = 390
  const [wakeMinutes, setWakeMinutes] = useState(390)

  const minMinutes = 270  // 4:30am
  const maxMinutes = 450  // 7:30am

  function minutesToLabel(mins) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    const ampm = h < 12 ? 'AM' : 'PM'
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour}:${m.toString().padStart(2,'0')} ${ampm}`
  }

  const timeLabel = minutesToLabel(wakeMinutes)

  // Snap to 15-minute intervals
  function handleSlider(val) {
    const raw = parseInt(val)
    const snapped = Math.round(raw / 15) * 15
    setWakeMinutes(Math.max(minMinutes, Math.min(maxMinutes, snapped)))
  }

  const markers = []
  for (let m = minMinutes; m <= maxMinutes; m += 30) {
    markers.push(m)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px', margin:'0 auto', flex:1, display:'flex', flexDirection:'column' }}>

        <ProgressBar step={6} total={11} />

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>

          <div style={{ textAlign:'center', marginBottom:'40px' }}>
            <div style={{ width:'80px', height:'80px', background:'#fff8e6', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <span style={{ fontSize:'40px' }}>🌅</span>
            </div>
            <h2 style={{ fontSize:'28px', fontWeight:'800', color:'var(--theme-text)', letterSpacing:'-0.02em', marginBottom:'8px' }}>
              Set your wake goal
            </h2>
            <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)', lineHeight:'1.6' }}>
              Choose the time you aim to wake up each day. You'll get a morning notification at this time to verify your wake habit.
            </p>
          </div>

          {/* Time display */}
          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <div style={{ background:'var(--theme-primary)', borderRadius:'20px', padding:'20px 32px', display:'inline-block' }}>
              <p style={{ fontSize:'48px', fontWeight:'800', color:'white', letterSpacing:'-0.02em', lineHeight:1 }}>
                {timeLabel}
              </p>
            </div>
          </div>

          {/* Slider */}
          <div style={{ marginBottom:'16px', padding:'0 8px' }}>
            <input
              type="range"
              min={minMinutes}
              max={maxMinutes}
              step={15}
              value={wakeMinutes}
              onChange={e => handleSlider(e.target.value)}
              style={{ width:'100%', accentColor:'var(--theme-primary)', height:'6px', cursor:'pointer' }}
            />
            {/* Marker labels */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:'8px' }}>
              {markers.map(m => (
                <span key={m} style={{ fontSize:'10px', color: m===wakeMinutes?'var(--theme-primary)':'var(--theme-text-muted)', fontWeight: m===wakeMinutes?'700':'400' }}>
                  {minutesToLabel(m)}
                </span>
              ))}
            </div>
          </div>

          {/* Notification note */}
          <div style={{ background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)', borderRadius:'12px', padding:'14px 16px', marginBottom:'32px' }}>
            <p style={{ fontSize:'12px', color:'var(--theme-primary)', lineHeight:'1.6' }}>
              🔔 At <strong>{timeLabel}</strong>, Niyama will send: <em>"Good morning! Time to start your day"</em> with <strong>[I'm up]</strong> and <strong>[Snoozing...]</strong> buttons. Tapping "I'm up" verifies your wake habit automatically.
            </p>
          </div>

          <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', textAlign:'center', marginBottom:'32px' }}>
            You can change this anytime in Settings.
          </p>
        </div>

        <button onClick={() => onContinue(wakeMinutes)}
          style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'14px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'15px' }}>
          Set wake time →
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
