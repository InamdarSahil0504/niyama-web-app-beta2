// Mobile tab order: Rewards | Stats | HOME (center raised) | History | Settings

function RewardsIcon({ active }) {
  const c = active ? '#4A7A68' : '#8A9E96'
  const pts = '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <polygon
        points={pts}
        fill={active ? c : 'none'}
        stroke={c}
        strokeWidth={active ? 0 : 1.6}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatsIcon({ active }) {
  const c = active ? '#4A7A68' : '#8A9E96'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      {active ? (
        <>
          <rect x="3" y="13" width="4" height="8" rx="1" fill={c} />
          <rect x="10" y="8" width="4" height="13" rx="1" fill={c} />
          <rect x="17" y="4" width="4" height="17" rx="1" fill={c} />
        </>
      ) : (
        <>
          <rect x="3" y="13" width="4" height="8" rx="1" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="10" y="8" width="4" height="13" rx="1" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="17" y="4" width="4" height="17" rx="1" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}

function HistoryIcon({ active }) {
  const c = active ? '#4A7A68' : '#8A9E96'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {active ? (
        <>
          <circle cx="12" cy="12" r="10" fill={c} stroke="none" />
          <path d="M12 6v6l3.5 3.5" stroke="#FFFFFF" strokeWidth="1.8" fill="none" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l3.5 3.5" />
        </>
      )}
    </svg>
  )
}

function SettingsIcon({ active }) {
  const c = active ? '#4A7A68' : '#8A9E96'
  const gear = 'M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5 3.5 3.5 0 0 1 15.5 12 3.5 3.5 0 0 1 12 15.5M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24">
      <path d={gear} fill={active ? c : 'none'} stroke={active ? 'none' : c} strokeWidth="1.4" strokeLinejoin="round" />
      {active && <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />}
    </svg>
  )
}

function HealthIcon({ active }) {
  const c = active ? '#4A7A68' : '#8A9E96'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {active ? (
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={c}
        />
      ) : (
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          stroke={c} strokeWidth="1.6" strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

// Tab order: rewards | analytics | home(center) | health | history | settings
const TABS = [
  { key: 'rewards',   label: 'Rewards',  Icon: RewardsIcon },
  { key: 'analytics', label: 'Stats',    Icon: StatsIcon },
  { key: 'home',      label: '',         Icon: null },   // center — NiyamaIcon
  { key: 'health',    label: 'Health',   Icon: HealthIcon },
  { key: 'history',   label: 'History',  Icon: HistoryIcon },
  { key: 'settings',  label: 'Settings', Icon: SettingsIcon },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '448px',
        background: '#FFFFFF',
        borderTop: '1px solid #E0E8E4',
        display: 'flex',
        alignItems: 'flex-end',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingTop: '4px',
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.key
          const isHome = tab.key === 'home'

          if (isHome) {
            return (
              <button
                key="home"
                onClick={() => onTabChange('home')}
                style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'flex-end',
                  paddingBottom: '4px',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                {/* Raised circle — floats above bar */}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '28px',
                  background: '#FFFFFF',
                  border: `3px solid ${active ? '#4A7A68' : '#E0E8E4'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: '-24px', marginBottom: '4px',
                  boxShadow: active
                    ? '0 4px 16px rgba(74,122,104,0.25)'
                    : '0 4px 12px rgba(0,0,0,0.12)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}>
                  <img src="/niyama-icon.svg" alt="Home" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                </div>
              </button>
            )
          }

          const { Icon } = tab
          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'flex-start',
                gap: '3px', paddingBottom: '8px',
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Active dot */}
              <div style={{ height: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2px' }}>
                {active && (
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4A7A68' }} />
                )}
              </div>

              <Icon active={active} />

              <span style={{
                fontSize: '10px',
                fontWeight: active ? '600' : '400',
                color: active ? '#4A7A68' : '#8A9E96',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s ease',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
