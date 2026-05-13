import { useState } from 'react'

export default function HealthPermission({ onContinue, onBack, onSkip }) {
  const [researchConsent, setResearchConsent] = useState(true)

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

        {/* Progress */}
        <ProgressBar step={4} total={9} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ width: '80px', height: '80px', background: '#fff0f0', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span style={{ fontSize: '40px' }}>🏥</span>
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
              Connect Health app
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>
              Niyama uses Apple Health or Google Fit to automatically verify your core habits — so you don't have to log everything manually.
            </p>
          </div>

          {/* What we access */}
          <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '14px' }}>What we read from your Health app</p>
            {[
              { icon: '🌅', label: 'Sleep & wake time', note: 'For wake habit verification' },
              { icon: '😴', label: 'Sleep analysis & duration', note: 'For sleep habit — 7–9 hrs tracking' },
              { icon: '👟', label: 'Steps & activity', note: 'For steps habit — automatic' },
              { icon: '🧍', label: 'Stand hours', note: 'For stand consistency habit' },
              { icon: '💓', label: 'Heart rate & HRV', note: 'Resting HR, HRV — for recovery insights' },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < arr.length - 1 ? '12px' : '0' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>{item.note}</p>
                </div>
              </div>
            ))}

            {/* Research consent toggle */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--theme-border)', display: 'flex', alignItems: 'flex-start', gap: '12px', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '2px' }}>Help advance health science</p>
                <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', lineHeight: '1.5' }}>Allow Niyama to use anonymised, de-identified data for health research. You can opt out anytime.</p>
              </div>
              <button
                onClick={() => setResearchConsent(v => !v)}
                style={{
                  flexShrink: 0,
                  width: '44px', height: '26px',
                  borderRadius: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  background: researchConsent ? 'var(--theme-primary)' : 'var(--theme-border)',
                  position: 'relative',
                  transition: 'background 0.2s',
                  marginTop: '2px',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '3px',
                  left: researchConsent ? '21px' : '3px',
                  width: '20px', height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          </div>

          {/* Privacy note */}
          <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--theme-primary)', lineHeight: '1.6' }}>
              🔒 <strong>Your data stays private.</strong> We never sell your health data. We never share it with insurers, employers, or advertisers. You can revoke access at any time in your device settings.
            </p>
          </div>

          {/* Note for PWA */}
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '14px 16px', marginBottom: '32px' }}>
            <p style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.6' }}>
              📱 <strong>Native app coming soon.</strong> Health auto-verification works in our iOS and Android apps. Health metrics including HRV, resting heart rate, stand hours, and sleep analysis will be tracked automatically. For now, you'll log core habits manually in the web app.
            </p>
          </div>
        </div>

        {/* Actions */}
        <button onClick={() => onContinue(researchConsent)}
          style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px', marginBottom: '12px' }}>
          Got it — continue →
        </button>
        <button onClick={onSkip}
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--theme-text-muted)', padding: '8px' }}>
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
