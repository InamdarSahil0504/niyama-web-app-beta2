import { useState } from 'react'

export default function WakeTime({ onContinue, onBack }) {
  const [hour, setHour] = useState(6)
  const [minute, setMinute] = useState('30')
  const [ampm, setAmpm] = useState('AM')

  const hourOptions = [4, 5, 6, 7, 8, 9, 10, 11]
  const minuteOptions = ['00', '15', '30', '45']

  const timeLabel = `${hour}:${minute} ${ampm}`

  function handleContinue() {
    const h24 = ampm === 'PM' && hour !== 12
      ? hour + 12
      : ampm === 'AM' && hour === 12
        ? 0
        : hour
    const wakeMinutes = h24 * 60 + parseInt(minute)
    onContinue(wakeMinutes)
  }

  const selectStyle = {
    background: 'var(--theme-bg)',
    border: '1px solid var(--theme-border)',
    borderRadius: '12px',
    padding: '14px 16px',
    fontSize: '16px',
    color: 'var(--theme-text)',
    width: '100%',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    textAlign: 'center',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', flexDirection: 'column', padding: '32px 24px' }}>
      {/* Back button */}
      {onBack && (
        <button onClick={onBack} style={{
          position: 'absolute', top: '24px', left: '24px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '14px', color: 'var(--theme-text-muted)',
          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px',
        }}>
          ← Back
        </button>
      )}
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>

        <ProgressBar step={6} total={9} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '80px', height: '80px', background: '#fff8e6', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: '40px' }}>🌅</span>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Set your wake goal
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>
              Choose the time you aim to wake up each day. You'll get a morning notification at this time to verify your wake habit.
            </p>
          </div>

          {/* Selected time pill */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ background: 'var(--theme-primary)', borderRadius: '20px', padding: '20px 32px', display: 'inline-block' }}>
              <p style={{ fontSize: '48px', fontWeight: '800', color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {timeLabel}
              </p>
            </div>
          </div>

          {/* Dropdowns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', marginBottom: '6px', textAlign: 'center' }}>
                Hour
              </label>
              <select
                value={hour}
                onChange={e => setHour(parseInt(e.target.value))}
                style={selectStyle}
              >
                {hourOptions.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', marginBottom: '6px', textAlign: 'center' }}>
                Minute
              </label>
              <select
                value={minute}
                onChange={e => setMinute(e.target.value)}
                style={selectStyle}
              >
                {minuteOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', marginBottom: '6px', textAlign: 'center' }}>
                AM/PM
              </label>
              <select
                value={ampm}
                onChange={e => setAmpm(e.target.value)}
                style={selectStyle}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* Notification note */}
          <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', color: 'var(--theme-primary)', lineHeight: '1.6' }}>
              🔔 At <strong>{timeLabel}</strong>, Niyama will send: <em>"Good morning! Time to start your day"</em> with <strong>[I'm up]</strong> and <strong>[Snoozing...]</strong> buttons. Tapping "I'm up" verifies your wake habit automatically.
            </p>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', textAlign: 'center', marginBottom: '32px' }}>
            You can change this anytime in Settings.
          </p>
        </div>

        <button onClick={handleContinue}
          style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
          Set wake time →
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
