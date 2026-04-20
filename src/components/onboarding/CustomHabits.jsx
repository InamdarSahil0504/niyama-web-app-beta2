import { useState } from 'react'
import { TIER_CONFIG, getEffectiveTier } from '../../config'

export default function CustomHabits({ profile, onContinue, onSkip }) {
  const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const slots = TIER_CONFIG[effectiveTier]?.custom_habit_slots || 0

  const [habit1, setHabit1] = useState('Stretching or yoga (15+ min)')
  const [habit2, setHabit2] = useState('Gratitude journaling')

  // Free tier — skip this screen entirely
  if (slots === 0) {
    onSkip()
    return null
  }

  const inputStyle = {
    background: 'var(--theme-bg)',
    border: '1px solid var(--theme-border)',
    color: 'var(--theme-text)',
    width: '100%',
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  function handleContinue() {
    const customs = []
    if (slots >= 1 && habit1.trim()) customs.push(habit1.trim())
    if (slots >= 2 && habit2.trim()) customs.push(habit2.trim())
    onContinue(customs)
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px', margin:'0 auto', flex:1, display:'flex', flexDirection:'column' }}>

        <ProgressBar step={9} total={11} />

        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>

          <div style={{ textAlign:'center', marginBottom:'32px' }}>
            <div style={{ width:'80px', height:'80px', background:'#fef3e2', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <span style={{ fontSize:'40px' }}>⭐</span>
            </div>
            <h2 style={{ fontSize:'28px', fontWeight:'800', color:'var(--theme-text)', letterSpacing:'-0.02em', marginBottom:'8px' }}>
              Your custom habits
            </h2>
            <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)', lineHeight:'1.6' }}>
              As a <strong>{TIER_CONFIG[effectiveTier]?.label}</strong> member, you get {slots} custom habit {slots===1?'slot':'slots'}. Add any habit that matters to you.
            </p>
          </div>

          {/* Habit inputs */}
          <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px' }}>

            <div>
              <label style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text-secondary)', display:'block', marginBottom:'6px' }}>
                Custom habit 1
              </label>
              <input
                type="text"
                placeholder="e.g. Cold shower, No sugar, Read 20 pages..."
                value={habit1}
                onChange={e => setHabit1(e.target.value)}
                maxLength={60}
                style={inputStyle}
              />
              <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginTop:'4px', textAlign:'right' }}>
                {habit1.length}/60
              </p>
            </div>

            {slots >= 2 && (
              <div>
                <label style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text-secondary)', display:'block', marginBottom:'6px' }}>
                  Custom habit 2
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meal prep, No social media, Journaling..."
                  value={habit2}
                  onChange={e => setHabit2(e.target.value)}
                  maxLength={60}
                  style={inputStyle}
                />
                <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginTop:'4px', textAlign:'right' }}>
                  {habit2.length}/60
                </p>
              </div>
            )}
          </div>

          {/* Info box */}
          <div style={{ background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)', borderRadius:'12px', padding:'14px 16px', marginBottom:'16px' }}>
            <p style={{ fontSize:'12px', color:'var(--theme-primary)', lineHeight:'1.6' }}>
              💡 Custom habits count toward your successful day and streak. They earn <strong>50 pts each</strong> when completed. You can change them once per month in Settings.
            </p>
          </div>
        </div>

        <button
          onClick={handleContinue}
          disabled={!habit1.trim()}
          style={{ width:'100%', background: habit1.trim()?'var(--theme-primary)':'var(--theme-border)', color: habit1.trim()?'white':'var(--theme-text-muted)', fontWeight:'700', padding:'14px', borderRadius:'10px', border:'none', cursor: habit1.trim()?'pointer':'not-allowed', fontSize:'15px', marginBottom:'12px' }}>
          Save my habits →
        </button>
        <button onClick={() => onContinue([])}
          style={{ width:'100%', background:'none', border:'none', cursor:'pointer', fontSize:'14px', color:'var(--theme-text-muted)', padding:'8px' }}>
          Use defaults for now
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
