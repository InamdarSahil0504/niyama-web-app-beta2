export default function RulesPage({ onContinue, onBack, showButton = true }) {
  const card = {
    background: 'var(--theme-card)',
    border: '1px solid var(--theme-border)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '12px',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', padding: '32px 24px 96px', maxWidth: '448px', margin: '0 auto', position: 'relative' }}>

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

      {/* Progress bar */}
      <div style={{ marginBottom: '28px', marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>Step 2 of 9</span>
          <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>22%</span>
        </div>
        <div style={{ background: 'var(--theme-border)', borderRadius: '4px', height: '4px' }}>
          <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '4px', width: '22%', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          How Niyama works
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>
          Simple rules. Real rewards. Daily discipline.
        </p>
      </div>

      {/* Step 1 */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>1</span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)' }}>Track 10 daily habits</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
          Your habits are split into three groups:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            {
              icon: '🔒',
              label: 'Core habits (3)',
              desc: 'Fixed for everyone — wake time, no phone after 10:30 PM, and steps. These are non-negotiable.',
              color: 'var(--theme-primary-light)',
              border: 'var(--theme-primary)',
            },
            {
              icon: '📚',
              label: 'Library habits (7, fixed)',
              desc: '7 science-backed habits fixed for all users — screen time, sleep phone cutoff, stand, sunlight, late food, recovery, meditation.',
              color: '#F0EEF7',
              border: '#7B6BAA',
            },
            {
              icon: '⭐',
              label: 'Personal habits',
              desc: 'Free/Basic — track unlimited, 0 pts. Plus — up to 2 earn 25 pts. Premium — up to 4 earn 25 pts.',
              color: '#FEF3E2',
              border: '#C9973A',
            },
          ].map((item, i) => (
            <div key={i} style={{ background: item.color, border: `1px solid ${item.border}`, borderRadius: '10px', padding: '10px 12px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '3px' }}>{item.icon} {item.label}</p>
              <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.4' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 2 */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>2</span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)' }}>Earn points every day</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { label: 'Core habit completed', value: '100 pts each' },
            { label: 'Steps — 5,000 / 7,500 / 10,000', value: '50 / 75 / 100 pts' },
            { label: 'Library or personal habit', value: '25 pts each' },
            { label: 'Successful day bonus', value: '+50 pts' },
            { label: 'Perfect day bonus (all 10)', value: '+100 pts' },
            { label: 'Daily maximum', value: '750 pts' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--theme-border)' : 'none' }}>
              <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-primary)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3 */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>3</span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)' }}>Hit a successful day</h3>
        </div>
        <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '10px', padding: '14px' }}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-primary)', marginBottom: '6px' }}>✅ Successful day = 2 of 3 core AND 3 of 7 library</p>
          <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.5' }}>
            Complete at least 2 of your 3 core habits and at least 3 of your 7 library habits. Build a streak of successful days to maximise your rewards.
          </p>
          <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
            Perfect day = all 10 habits (3 core + 7 library) · +100 pts bonus
          </p>
        </div>
      </div>

      {/* Step 4 */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>4</span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)' }}>Earn monthly rewards</h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
          Hit your minimum successful days for your tier and your points convert to a gift card reward — delivered on the 1st of every month.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { tier: 'Free (trial)', min: '10 days', cap: 'Up to $2.50/mo', note: 'first 3 months', color: 'var(--theme-border)', text: 'var(--theme-text-muted)' },
            { tier: 'Basic', min: '10 days', cap: 'Up to $5.00/mo', note: '', color: 'var(--theme-primary-light)', text: 'var(--theme-primary)' },
            { tier: 'Plus', min: '7 days', cap: 'Up to $17.50/mo', note: 'with milestones', color: 'var(--theme-primary-light)', text: 'var(--theme-primary)' },
            { tier: 'Premium', min: '5 days', cap: 'Up to $35.00/mo', note: 'with milestones', color: '#FEF3E2', text: '#C9973A' },
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.color, borderRadius: '8px', padding: '8px 12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: t.text }}>{t.tier}</span>
              <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>{t.min} min</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: t.text }}>{t.cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 5 */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>5</span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)' }}>A few important rules</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            '✏️ Submit your habits before midnight each day — once submitted, your log is final.',
            '📵 5 or more consecutive inactive days makes you ineligible for that month\'s reward.',
            '❄️ Streak freeze available once per month on Plus and Premium — protects your streak for one missed day.',
            '🎁 Rewards are gift cards only — Amazon, Starbucks, Nike, and more. No cash transfers.',
            '🔒 One account per person. No sharing accounts.',
          ].map((rule, i) => (
            <p key={i} style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.5', padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--theme-border)' : 'none' }}>
              {rule}
            </p>
          ))}
        </div>
      </div>

      {showButton && (
        <button onClick={onContinue}
          style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '15px' }}>
          I understand — let's go →
        </button>
      )}
    </div>
  )
}
