import { useState } from 'react'

const MOODS = [
  { value: 1, emoji: '😩', label: 'Rough day' },
  { value: 2, emoji: '😕', label: 'Not great' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Good day' },
  { value: 5, emoji: '🔥', label: 'Amazing' },
]

export default function MoodCheckIn({ onSelect, onSkip }) {
  const [selected, setSelected] = useState(null)
  const [animating, setAnimating] = useState(false)

  function handleSelect(value) {
    setSelected(value)
    setAnimating(true)
    setTimeout(() => {
      onSelect(value)
    }, 600)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'var(--theme-bg)',
        borderRadius: '24px 24px 0 0',
        padding: '32px 24px 48px',
        width: '100%',
        maxWidth: '448px',
        animation: 'slideUp 0.3s ease',
      }}>
        {/* Handle bar */}
        <div style={{ width: '40px', height: '4px', background: 'var(--theme-border)', borderRadius: '2px', margin: '0 auto 28px', opacity: 0.5 }} />

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--theme-text)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            How was your day?
          </p>
          <p style={{ fontSize: '14px', color: 'var(--theme-text-muted)', lineHeight: '1.5' }}>
            One tap — helps us understand how discipline affects your well-being.
          </p>
        </div>

        {/* Emoji selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', padding: '0 8px' }}>
          {MOODS.map(mood => {
            const isSelected = selected === mood.value
            return (
              <button
                key={mood.value}
                onClick={() => !animating && handleSelect(mood.value)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  background: 'none', border: 'none', cursor: animating ? 'default' : 'pointer',
                  padding: '12px 8px', borderRadius: '16px',
                  transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  opacity: selected && !isSelected ? 0.3 : 1,
                }}
              >
                <span style={{ fontSize: '36px', lineHeight: 1 }}>{mood.emoji}</span>
                <span style={{
                  fontSize: '10px', fontWeight: '600',
                  color: isSelected ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
                  transition: 'color 0.2s',
                  whiteSpace: 'nowrap',
                }}>
                  {mood.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Skip */}
        {!selected && (
          <button
            onClick={onSkip}
            style={{
              width: '100%', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: '14px',
              color: 'var(--theme-text-muted)', padding: '8px',
              textAlign: 'center',
            }}
          >
            Skip for today
          </button>
        )}

        {selected && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: 'var(--theme-primary)', fontWeight: '600', animation: 'fadeIn 0.3s ease' }}>
              ✓ Got it — saving your day...
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
