import { useState } from 'react'
import { getEffectiveTier, TIER_CONFIG } from '../../config'

export default function CustomHabits({ profile, onContinue, onSkip }) {
  const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)

  const [habits, setHabits] = useState([])
  const [adding, setAdding] = useState(false)
  const [newHabit, setNewHabit] = useState('')

  function handleAdd() {
    const trimmed = newHabit.trim()
    if (!trimmed) return
    setHabits(prev => [...prev, trimmed])
    setNewHabit('')
    setAdding(false)
  }

  function handleDelete(index) {
    setHabits(prev => prev.filter((_, i) => i !== index))
  }

  function handleContinue() {
    onContinue(habits)
  }

  function tierInfoText() {
    if (effectiveTier === 'plus') {
      return 'Up to 2 personal habits earn 25 pts each per day. Additional habits track for free.'
    }
    if (effectiveTier === 'premium') {
      return 'Up to 4 personal habits earn 25 pts each per day. Additional habits track for free.'
    }
    return 'You can track unlimited personal habits. Upgrade to Plus or Premium to earn points on them.'
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', flexDirection: 'column', padding: '32px 24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

        <ProgressBar step={7} total={9} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', background: '#fef3e2', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span style={{ fontSize: '40px' }}>⭐</span>
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Your personal habits
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>
            Track any habit that matters to you. Personal habits don't count toward successful day.
          </p>
        </div>

        {/* Tier info badge */}
        <div style={{ background: '#F0F7F4', border: '1px solid #A8D5BC', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', color: '#2D6A4F', lineHeight: '1.6' }}>
            💡 {tierInfoText()}
          </p>
        </div>

        {/* Habit list */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {habits.length === 0 && !adding && (
            <p style={{ fontSize: '14px', color: 'var(--theme-text-muted)', textAlign: 'center', padding: '24px 0' }}>
              No habits added yet.
            </p>
          )}
          {habits.map((habit, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '10px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>⭐</span>
                <span style={{ fontSize: '14px', color: 'var(--theme-text)' }}>{habit}</span>
              </div>
              <button
                onClick={() => handleDelete(i)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--theme-text-muted)', padding: '4px 8px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>
          ))}

          {/* Add input */}
          {adding && (
            <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-primary)', borderRadius: '10px', padding: '12px 14px' }}>
              <input
                type="text"
                placeholder="e.g. Cold shower, Journaling, Read 20 pages..."
                value={newHabit}
                onChange={e => setNewHabit(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                autoFocus
                maxLength={60}
                style={{
                  background: 'var(--theme-bg)',
                  border: '1px solid var(--theme-border)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '14px',
                  color: 'var(--theme-text)',
                  width: '100%',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '10px',
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleAdd}
                  disabled={!newHabit.trim()}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: newHabit.trim() ? 'pointer' : 'not-allowed',
                    background: newHabit.trim() ? 'var(--theme-primary)' : 'var(--theme-border)',
                    color: newHabit.trim() ? 'white' : 'var(--theme-text-muted)',
                    fontWeight: '600', fontSize: '14px',
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => { setAdding(false); setNewHabit('') }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--theme-border)', cursor: 'pointer', background: 'transparent', color: 'var(--theme-text-secondary)', fontWeight: '600', fontSize: '14px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add habit button */}
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid var(--theme-primary)',
                background: 'transparent', color: 'var(--theme-primary)',
                fontWeight: '600', fontSize: '14px', cursor: 'pointer',
              }}
            >
              + Add habit
            </button>
          )}
        </div>

        {/* Continue */}
        <button
          onClick={handleContinue}
          style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px', marginBottom: '12px' }}
        >
          Continue →
        </button>
        <button
          onClick={() => onContinue([])}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--theme-text-muted)', padding: '8px' }}
        >
          Skip for now
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
