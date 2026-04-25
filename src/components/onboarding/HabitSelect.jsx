import { useState } from 'react'
import { LIBRARY_HABITS, DEFAULT_LIBRARY_KEYS } from '../../config'

export default function HabitSelect({ onContinue }) {
  const [selected, setSelected] = useState(new Set(DEFAULT_LIBRARY_KEYS))

  function toggle(key) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const selectedCount = selected.size

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', flexDirection: 'column', padding: '32px 24px' }}>
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

        <ProgressBar step={8} total={11} />

        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
            Choose your 4 habits
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>
            Pick 4 science-backed habits to track alongside your core habits. You can change these once per month.
          </p>
        </div>

        {/* Selection counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>Selected</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: i <= selectedCount ? 'var(--theme-primary)' : 'var(--theme-border)',
                transition: 'background 0.15s',
              }} />
            ))}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-primary)' }}>{selectedCount}/4</span>
        </div>

        {/* Habit list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', paddingBottom: '8px' }}>
          {LIBRARY_HABITS.map(habit => {
            const isSelected = selected.has(habit.key)
            return (
              <button
                key={habit.key}
                onClick={() => toggle(habit.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  background: isSelected ? 'var(--theme-primary)' : 'var(--theme-card)',
                  border: `2px solid ${isSelected ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                  borderRadius: '14px', padding: '14px 16px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s ease', flexShrink: 0,
                }}
              >
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{habit.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: isSelected ? 'white' : 'var(--theme-text)', marginBottom: '2px' }}>
                    {habit.label}
                  </p>
                  <p style={{ fontSize: '11px', color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--theme-text-muted)' }}>
                    {habit.science}
                  </p>
                </div>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--theme-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <span style={{ fontSize: '12px', color: 'white' }}>✓</span>}
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={() => selected.size === 4 && onContinue([...selected])}
          disabled={selected.size !== 4}
          style={{ width: '100%', background: selected.size === 4 ? 'var(--theme-primary)' : 'var(--theme-border)', color: selected.size === 4 ? 'white' : 'var(--theme-text-muted)', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: selected.size === 4 ? 'pointer' : 'not-allowed', fontSize: '15px' }}>
          {selected.size === 4 ? 'Confirm my habits →' : `Select ${4 - selected.size} more habit${4 - selected.size === 1 ? '' : 's'}`}
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
