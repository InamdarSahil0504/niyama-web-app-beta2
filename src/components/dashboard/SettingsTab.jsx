import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { applyTheme, TIER_CONFIG, getEffectiveTier, LIBRARY_HABITS, trackEvent } from '../../config'

// ─── Shared helpers ────────────────────────────────────────────────────────────
function SubScreen({ title, onBack, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme-primary)', flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--theme-text)', margin: 0 }}>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function SettingsRow({ icon, label, subtitle, onPress, chevron = true, danger = false, badge }) {
  return (
    <button onClick={onPress} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', borderBottom: '1px solid var(--theme-border)' }}>
      {icon && (
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: danger ? '#fef2f2' : 'var(--theme-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: danger ? '#dc2626' : 'var(--theme-text)', margin: 0 }}>{label}</p>
          {badge && <span style={{ fontSize: '10px', fontWeight: '700', background: 'var(--theme-primary)', color: 'white', padding: '2px 7px', borderRadius: '8px' }}>{badge}</span>}
        </div>
        {subtitle && <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', margin: '2px 0 0', lineHeight: '1.4' }}>{subtitle}</p>}
      </div>
      {chevron && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={danger ? '#dc2626' : 'var(--theme-text-muted)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  )
}

function SectionCard({ children, style }) {
  return (
    <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', ...style }}>
      {children}
    </div>
  )
}

// ─── Main SettingsTab ──────────────────────────────────────────────────────────
export default function SettingsTab({ session, profile, streak, onSignOut, onRefresh }) {
  const [screen, setScreen] = useState('main')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')

  const userId = session.user.id
  const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const tierConfig = TIER_CONFIG[effectiveTier]

  function showMessage(msg, type = 'success') {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const card = {
    background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  }

  // Sub-screen routing
  if (screen === 'profile') return <ProfileSection onBack={() => setScreen('main')} profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} onRefresh={onRefresh} />
  if (screen === 'habits') return <HabitsSection onBack={() => setScreen('main')} profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} onRefresh={onRefresh} effectiveTier={effectiveTier} tierConfig={tierConfig} />
  if (screen === 'how-niyama-works') return <HowNiyamaWorksHub onBack={() => setScreen('main')} card={card} />
  if (screen === 'founder-story') return <FounderStoryScreen onBack={() => setScreen('how-niyama-works')} card={card} />
  if (screen === 'the-science') return <TheScienceScreen onBack={() => setScreen('how-niyama-works')} card={card} />
  if (screen === 'how-it-works') return <HowItWorksScreen onBack={() => setScreen('how-niyama-works')} card={card} />
  if (screen === 'plan-rewards') return <PlanRewardsSection onBack={() => setScreen('main')} profile={profile} card={card} effectiveTier={effectiveTier} tierConfig={tierConfig} />
  if (screen === 'billing') return <BillingSection onBack={() => setScreen('main')} profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} effectiveTier={effectiveTier} tierConfig={tierConfig} />
  if (screen === 'preferences') return <PreferencesSection onBack={() => setScreen('main')} profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} onRefresh={onRefresh} />
  if (screen === 'legal') return <LegalSection onBack={() => setScreen('main')} card={card} profile={profile} />
  if (screen === 'account') return <AccountSection onBack={() => setScreen('main')} profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} onSignOut={onSignOut} effectiveTier={effectiveTier} tierConfig={tierConfig} streak={streak} />

  const isFree = effectiveTier === 'free_trial' || effectiveTier === 'free_expired'

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--theme-text)', marginBottom: '2px' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>{profile?.full_name || 'Your account'}</p>
      </div>

      {/* Toast */}
      {message && (
        <div style={{ background: messageType === 'success' ? 'var(--theme-primary-light)' : '#fef2f2', border: `1px solid ${messageType === 'success' ? 'var(--theme-primary)' : '#fecaca'}`, borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: messageType === 'success' ? 'var(--theme-primary)' : '#dc2626', fontWeight: '600', margin: 0 }}>
            {messageType === 'success' ? '✓ ' : '⚠️ '}{message}
          </p>
        </div>
      )}

      {/* Section 1 & 2 — Personal */}
      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '4px' }}>Personal</p>
      <SectionCard>
        <SettingsRow icon="👤" label="My Profile" subtitle="Personal info, stats, member since" onPress={() => setScreen('profile')} />
        <SettingsRow icon="✅" label="My Habits" subtitle="Wake time, library habits, custom habits" onPress={() => setScreen('habits')} style={{ borderBottom: 'none' }} />
      </SectionCard>

      {/* Section 3 & 4 — Niyama */}
      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '4px', marginTop: '20px' }}>Niyama</p>
      <SectionCard>
        <SettingsRow icon="🌿" label="How Niyama Works" subtitle="Founder's story, the science, how it works" onPress={() => setScreen('how-niyama-works')} />
        <SettingsRow icon="🎁" label="Your Plan & Rewards" subtitle={`${tierConfig?.label || 'Free'} · ${isFree ? 'Upgrade to earn rewards' : `Up to $${(tierConfig?.max_cap || tierConfig?.reward_cap || 0).toFixed(2)}/month`}`} onPress={() => setScreen('plan-rewards')} style={{ borderBottom: 'none' }} />
      </SectionCard>

      {/* Section 5 & 6 — Settings */}
      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '4px', marginTop: '20px' }}>App</p>
      <SectionCard>
        <SettingsRow icon="💳" label="Billing" subtitle={isFree ? 'Free plan · Upgrade anytime' : `${tierConfig?.label} · ${profile?.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}`} onPress={() => setScreen('billing')} badge={profile?.subscription_status === 'past_due' ? 'Past due' : null} />
        <SettingsRow icon="🔔" label="Preferences" subtitle="Notifications, theme, app version" onPress={() => setScreen('preferences')} style={{ borderBottom: 'none' }} />
      </SectionCard>

      {/* Section 7 & 8 — Other */}
      <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px', paddingLeft: '4px', marginTop: '20px' }}>Other</p>
      <SectionCard>
        <SettingsRow icon="⚖️" label="Legal & Trust" subtitle="Terms, privacy, about Niyama Life Inc." onPress={() => setScreen('legal')} />
        <SettingsRow icon="⚙️" label="Account" subtitle="Sign out, pause, delete account" onPress={() => setScreen('account')} style={{ borderBottom: 'none' }} />
      </SectionCard>

      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '28px', marginBottom: '8px' }}>
        Niyama Life Inc. · Delaware C-Corp · v2.0.0
      </p>
    </div>
  )
}

// ─── 1. My Profile ─────────────────────────────────────────────────────────────
function ProfileSection({ onBack, profile, userId, card, saving, setSaving, showMessage, onRefresh }) {
  return (
    <SubScreen title="My Profile" onBack={onBack}>
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Personal info</p>
        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '14px', lineHeight: '1.5', background: 'var(--theme-bg)', borderRadius: '8px', padding: '8px 10px' }}>
          🔒 To update personal details, email <strong>support@niyamalife.com</strong>
        </p>
        {[
          { label: 'Full name', value: profile?.full_name || '—' },
          { label: 'Email', value: profile?.email || '—' },
          { label: 'Phone', value: profile?.phone || 'Not provided' },
          { label: 'Date of birth', value: profile?.date_of_birth ? new Date(profile.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
          { label: 'Region', value: profile?.region === 'india' ? '🇮🇳 India' : '🇺🇸 United States' },
          { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
        ].map((item, i, arr) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--theme-border)' : 'none' }}>
            <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Your stats</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Days logged', value: profile?.total_days_logged || 0, suffix: 'days' },
            { label: 'Successful days', value: profile?.overall_successful_days || 0, suffix: 'days' },
            { label: 'Current streak', value: profile?.current_streak || 0, suffix: 'days' },
            { label: 'Total points', value: (profile?.total_points_earned || 0).toLocaleString(), suffix: 'pts' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'var(--theme-bg)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--theme-primary)', margin: '0 0 2px' }}>{stat.value}</p>
              <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', margin: 0 }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </SubScreen>
  )
}

// ─── 2. My Habits ──────────────────────────────────────────────────────────────
function HabitsSection({ onBack, profile, userId, card, saving, setSaving, showMessage, onRefresh, effectiveTier, tierConfig }) {
  const [wakeMinutes, setWakeMinutes] = useState(profile?.wake_time_minutes || 450)
  const [wakeChanged, setWakeChanged] = useState(false)
  const [movement, setMovement] = useState('steps')
  const [selectedLibrary, setSelectedLibrary] = useState([])
  const [custom1, setCustom1] = useState('')
  const [custom2, setCustom2] = useState('')
  const [loading, setLoading] = useState(true)
  const customSlots = tierConfig?.custom_habit_slots || 0

  useEffect(() => { loadHabits() }, [])

  async function loadHabits() {
    setLoading(true)
    const { data } = await supabase.from('user_habits').select('*').eq('user_id', userId)
    if (data && data.length > 0) {
      const libraryRows = data.filter(h => h.habit_type === 'library')
      setSelectedLibrary(libraryRows.map(h => h.habit_key))
      const customRows = data.filter(h => h.habit_type === 'custom')
      if (customRows[0]) setCustom1(customRows[0].habit_label || '')
      if (customRows[1]) setCustom2(customRows[1].habit_label || '')
      const stepsRow = data.find(h => h.habit_key === 'steps')
      if (stepsRow?.habit_label === 'activity') setMovement('activity')
    }
    const { data: profileData } = await supabase.from('profiles').select('wake_time_minutes').eq('id', userId).single()
    if (profileData?.wake_time_minutes) setWakeMinutes(profileData.wake_time_minutes)
    setLoading(false)
  }

  function minutesToLabel(mins) {
    const h = Math.floor(mins / 60), m = mins % 60
    const ampm = h < 12 ? 'AM' : 'PM', hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  function toggleLibrary(key) {
    setSelectedLibrary(prev => {
      if (prev.includes(key)) return prev.length <= 4 ? prev : prev.filter(k => k !== key)
      if (prev.length >= 4) { const next = [...prev]; next[3] = key; return next }
      return [...prev, key]
    })
  }

  async function saveWakeTime() {
    setSaving(true)
    await supabase.from('profiles').update({ wake_time_minutes: wakeMinutes }).eq('id', userId)
    setWakeChanged(false)
    showMessage('Wake time updated.')
    onRefresh()
    setSaving(false)
  }

  async function saveHabits() {
    const { data: lockCheck } = await supabase.from('profiles').select('habits_last_changed').eq('id', userId).single()
    if (lockCheck?.habits_last_changed) {
      const daysSince = (Date.now() - new Date(lockCheck.habits_last_changed)) / (1000 * 60 * 60 * 24)
      if (daysSince < 30) {
        const daysLeft = Math.ceil(30 - daysSince)
        showMessage(`Habits locked for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}.`, 'error')
        return
      }
    }
    setSaving(true)
    try {
      await supabase.from('user_habits').delete().eq('user_id', userId)
      const rows = []
      rows.push({ user_id: userId, habit_type: 'core', habit_key: 'wake', habit_label: 'Wake before chosen time', is_active: true, slot_index: 0 })
      rows.push({ user_id: userId, habit_type: 'core', habit_key: 'no_phone', habit_label: 'No phone after 10:30pm', is_active: true, slot_index: 1 })
      rows.push({ user_id: userId, habit_type: 'core', habit_key: 'steps', habit_label: movement === 'activity' ? 'activity' : 'steps', is_active: true, slot_index: 2 })
      selectedLibrary.slice(0, 4).forEach((key, i) => {
        const lib = LIBRARY_HABITS.find(h => h.key === key)
        rows.push({ user_id: userId, habit_type: 'library', habit_key: key, habit_label: lib?.label || key, habit_icon: lib?.icon, is_active: true, slot_index: i })
      })
      if (customSlots >= 1 && custom1.trim()) rows.push({ user_id: userId, habit_type: 'custom', habit_key: 'custom_1', habit_label: custom1.trim(), is_active: true, slot_index: 0 })
      if (customSlots >= 2 && custom2.trim()) rows.push({ user_id: userId, habit_type: 'custom', habit_key: 'custom_2', habit_label: custom2.trim(), is_active: true, slot_index: 1 })
      await supabase.from('user_habits').insert(rows)
      await supabase.from('profiles').update({ wake_time_minutes: wakeMinutes, habits_last_changed: new Date().toISOString() }).eq('id', userId)
      showMessage('Habits updated.')
      onRefresh()
    } catch (e) { showMessage('Failed to save.', 'error') }
    setSaving(false)
  }

  const habitsLocked = (() => {
    if (!profile?.habits_last_changed) return false
    return (Date.now() - new Date(profile.habits_last_changed)) / (1000 * 60 * 60 * 24) < 30
  })()
  const daysLeft = habitsLocked ? Math.ceil(30 - (Date.now() - new Date(profile.habits_last_changed)) / (1000 * 60 * 60 * 24)) : 0

  if (loading) return (
    <SubScreen title="My Habits" onBack={onBack}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid var(--theme-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    </SubScreen>
  )

  return (
    <SubScreen title="My Habits" onBack={onBack}>
      {/* Wake time */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Wake goal</p>
        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>Wake time can be updated anytime — habit changes lock for 30 days.</p>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ background: 'var(--theme-primary)', borderRadius: '14px', padding: '12px 24px', display: 'inline-block' }}>
            <p style={{ fontSize: '32px', fontWeight: '800', color: 'white', lineHeight: 1, margin: 0 }}>{minutesToLabel(wakeMinutes)}</p>
          </div>
        </div>
        <input type="range" min={270} max={450} step={15} value={wakeMinutes}
          onChange={e => { setWakeMinutes(parseInt(e.target.value)); setWakeChanged(true) }}
          style={{ width: '100%', accentColor: 'var(--theme-primary)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>4:30 AM</span>
          <span style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>7:30 AM</span>
        </div>
        {wakeChanged && (
          <button onClick={saveWakeTime} disabled={saving}
            style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '11px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save wake time'}
          </button>
        )}
      </div>

      {/* Lock notice */}
      <div style={{ background: habitsLocked ? '#fffbeb' : 'var(--theme-primary-light)', border: `1px solid ${habitsLocked ? '#fcd34d' : 'var(--theme-primary)'}`, borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
        <p style={{ fontSize: '12px', color: habitsLocked ? '#92400e' : 'var(--theme-primary)', lineHeight: '1.5', margin: 0 }}>
          {habitsLocked
            ? `🔒 Habits locked for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}. You can change your habits once every 30 days.`
            : '✅ Your habits are unlocked. Make changes and save below.'}
        </p>
      </div>

      {/* Movement */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Movement habit</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { key: 'steps', label: 'Steps', icon: '👟', desc: '5k / 7.5k / 10k tiers' },
            { key: 'activity', label: 'Physical activity', icon: '🏃', desc: '30 min active HR' },
          ].map(opt => (
            <button key={opt.key} onClick={() => !habitsLocked && setMovement(opt.key)}
              style={{ padding: '12px', borderRadius: '12px', cursor: habitsLocked ? 'not-allowed' : 'pointer', textAlign: 'center', background: movement === opt.key ? 'var(--theme-primary)' : 'var(--theme-bg)', border: `2px solid ${movement === opt.key ? 'var(--theme-primary)' : 'var(--theme-border)'}`, opacity: habitsLocked ? 0.6 : 1 }}>
              <p style={{ fontSize: '20px', marginBottom: '4px', margin: '0 0 4px' }}>{opt.icon}</p>
              <p style={{ fontSize: '12px', fontWeight: '700', color: movement === opt.key ? 'white' : 'var(--theme-text)', margin: '0 0 2px' }}>{opt.label}</p>
              <p style={{ fontSize: '10px', color: movement === opt.key ? 'rgba(255,255,255,0.7)' : 'var(--theme-text-muted)', margin: 0 }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Library habits */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Your 4 library habits</p>
        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '12px' }}>Select exactly 4 from the list below.</p>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i < selectedLibrary.length ? 'var(--theme-primary)' : 'var(--theme-border)' }} />
          ))}
          <span style={{ fontSize: '11px', color: 'var(--theme-primary)', fontWeight: '700', marginLeft: '4px' }}>{selectedLibrary.length}/4</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LIBRARY_HABITS.map(habit => {
            const isSelected = selectedLibrary.includes(habit.key)
            return (
              <button key={habit.key} onClick={() => !habitsLocked && toggleLibrary(habit.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', cursor: habitsLocked ? 'not-allowed' : 'pointer', textAlign: 'left', background: isSelected ? 'var(--theme-primary)' : 'var(--theme-bg)', border: `1px solid ${isSelected ? 'var(--theme-primary)' : 'var(--theme-border)'}`, opacity: habitsLocked ? 0.7 : 1 }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{habit.icon}</span>
                <span style={{ fontSize: '13px', color: isSelected ? 'white' : 'var(--theme-text-secondary)', flex: 1 }}>{habit.label}</span>
                {isSelected && <span style={{ fontSize: '12px', color: 'white' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom habits */}
      {customSlots > 0 && (
        <div style={card}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Custom habits ({customSlots} slot{customSlots > 1 ? 's' : ''})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>Custom habit 1</label>
              <input type="text" value={custom1} onChange={e => !habitsLocked && setCustom1(e.target.value)} maxLength={60} placeholder="e.g. Cold shower, No sugar..." disabled={habitsLocked}
                style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)', width: '100%', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', opacity: habitsLocked ? 0.6 : 1 }} />
            </div>
            {customSlots >= 2 && (
              <div>
                <label style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>Custom habit 2</label>
                <input type="text" value={custom2} onChange={e => !habitsLocked && setCustom2(e.target.value)} maxLength={60} placeholder="e.g. Meal prep, Journaling..." disabled={habitsLocked}
                  style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)', width: '100%', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', opacity: habitsLocked ? 0.6 : 1 }} />
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={saveHabits} disabled={saving || selectedLibrary.length !== 4 || habitsLocked}
        style={{ width: '100%', background: selectedLibrary.length === 4 && !habitsLocked ? 'var(--theme-primary)' : 'var(--theme-border)', color: selectedLibrary.length === 4 && !habitsLocked ? 'white' : 'var(--theme-text-muted)', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: saving || selectedLibrary.length !== 4 || habitsLocked ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: saving ? 0.7 : 1 }}>
        {habitsLocked ? `Locked for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}` : saving ? 'Saving...' : selectedLibrary.length === 4 ? 'Save habit changes' : 'Select exactly 4 habits'}
      </button>
    </SubScreen>
  )
}

// ─── 3. How Niyama Works — Hub ─────────────────────────────────────────────────
function HowNiyamaWorksHub({ onBack, card }) {
  const [screen, setScreen] = useState('hub')

  if (screen === 'founder') return <FounderStoryScreen onBack={() => setScreen('hub')} card={card} />
  if (screen === 'science') return <TheScienceScreen onBack={() => setScreen('hub')} card={card} />
  if (screen === 'how') return <HowItWorksScreen onBack={() => setScreen('hub')} card={card} />

  return (
    <SubScreen title="How Niyama Works" onBack={onBack}>
      <div style={{ background: 'var(--theme-primary)', borderRadius: '16px', padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <img src="/niyama-icon.svg" alt="Niyama Life" style={{ width: '64px', height: '64px', borderRadius: '16px', margin: '0 auto 8px', display: 'block' }} />
        <p style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: '0 0 4px' }}>Rewarding Discipline.</p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: '1.5' }}>Science-backed habits. Real financial rewards.</p>
      </div>
      <SectionCard>
        <SettingsRow icon="💌" label="Founder's Story" subtitle="Why Sahil built Niyama" onPress={() => setScreen('founder')} />
        <SettingsRow icon="🔬" label="The Science" subtitle="Research behind each of your 9 habits" onPress={() => setScreen('science')} />
        <SettingsRow icon="⚙️" label="How It Works" subtitle="Points, rewards, successful days explained" onPress={() => setScreen('how')} />
      </SectionCard>
    </SubScreen>
  )
}

// ─── 3a. Founder's Story ───────────────────────────────────────────────────────
function FounderStoryScreen({ onBack, card }) {
  return (
    <SubScreen title="Founder's Story" onBack={onBack}>
      <div style={{ ...card, background: 'linear-gradient(135deg, #3D6B5A, #4A7A68)', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>👨‍🔬</div>
          <div>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'white', margin: '0 0 2px' }}>Sahil Inamdar</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', margin: 0 }}>PhD · Senior Scientist · Founder & CEO</p>
          </div>
        </div>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)', lineHeight: '1.7', margin: 0, fontStyle: 'italic' }}>
          "I spent years studying disease — cancer, Alzheimer's, Parkinson's. What kept coming up wasn't just genetics or luck. It was daily behaviour."
        </p>
      </div>

      {[
        {
          heading: 'The problem I kept seeing',
          body: 'As a research scientist with a PhD in Chemical Engineering, I spent years working on some of the hardest problems in human health — cancer immunotherapy, neurodegeneration, traumatic brain injury. The science was clear: most chronic disease and cognitive decline is driven not by fate, but by daily choices. Sleep. Movement. Stress. What we eat. What we expose ourselves to. The research pointed at behaviour again and again.\n\nBut behaviour is hard. Not because people don\'t know what to do — most do. It\'s hard because the world is designed to work against it. Dopamine is hijacked by infinite scroll. Sleep is sacrificed for productivity. Movement is optional when delivery is one tap away.'
        },
        {
          heading: 'Why money changes things',
          body: 'I tried every habit app. Streaks, badges, points — they work for a while. But gamification fades. What doesn\'t fade is your bank account.\n\nFinancial reinforcement is one of the most well-studied behaviour change mechanisms in psychology. It\'s why workplace wellness programs work. Why quit-smoking contracts work. The reward doesn\'t need to be large — it needs to be real. A gift card you actually receive changes the psychological calculus. You\'re not just avoiding bad habits. You\'re being paid to build good ones.'
        },
        {
          heading: 'Why 9 specific habits',
          body: 'I didn\'t pick 9 habits because 9 sounded good. I picked them because they have the strongest and most consistent scientific backing for long-term health, cognitive performance, and mental well-being. Every habit in Niyama has decades of research behind it. The Science section explains each one in detail.\n\nThe 30-day lock on habit changes isn\'t a restriction — it\'s a feature. Behaviour change research is clear: you need at least 21 days to form a habit, and 30+ days to make it stick. Letting you change habits weekly would undermine the entire point.'
        },
        {
          heading: 'What Niyama is not',
          body: 'Niyama is not a habit tracker. It\'s a behaviour change platform. The difference matters. A tracker records what you do. Niyama is designed to change what you do — and to reward you financially when you do it.\n\nI built this because I believe the most important thing any of us can do for our health, our minds, and our futures is show up every day. Niyama is built to make that easier. And to make it worth it.'
        },
      ].map((section, i) => (
        <div key={i} style={card}>
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-primary)', marginBottom: '10px' }}>{section.heading}</p>
          {section.body.split('\n\n').map((para, j) => (
            <p key={j} style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.7', margin: j < section.body.split('\n\n').length - 1 ? '0 0 10px' : 0 }}>{para}</p>
          ))}
        </div>
      ))}

      <div style={{ ...card, background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--theme-primary)', fontWeight: '600', lineHeight: '1.6', margin: 0 }}>
          "Daily discipline. Backed by science. Rewarded financially."
        </p>
      </div>
    </SubScreen>
  )
}

// ─── 3b. The Science ───────────────────────────────────────────────────────────
function TheScienceScreen({ onBack, card }) {
  const [expanded, setExpanded] = useState(null)

  const habits = [
    {
      key: 'wake', icon: '⏰', label: 'Wake before 7:30 AM', type: 'CORE', color: '#4A7A68',
      hook: 'Your wake time sets your entire day\'s biology.',
      science: 'Consistent wake times — not bedtimes — are the primary regulator of your circadian rhythm. Your body clock governs cortisol, melatonin, body temperature, and dozens of hormones on a 24-hour cycle anchored by when you rise.\n\nResearch shows that irregular wake times — even by just 1-2 hours on weekends — cause "social jetlag," a state that impairs insulin sensitivity, mood, and cognitive performance comparable to crossing multiple time zones. Early, consistent rising correlates with lower rates of depression, higher subjective well-being, and better academic and professional performance across multiple large-scale studies.\n\nThe 7:30 AM ceiling isn\'t arbitrary. Light exposure before this window activates the cortisol awakening response — a natural, healthy cortisol spike that primes alertness. Miss this window and you spend the first half of your day running on a hormonal deficit.'
    },
    {
      key: 'no_phone', icon: '📵', label: 'No phone after 10:30 PM', type: 'CORE', color: '#4A7A68',
      hook: 'The problem isn\'t just the blue light. It\'s what the light tells your brain.',
      science: 'Screens emit short-wavelength blue light that directly suppresses melatonin production in the pineal gland — the hormone that signals your body it\'s time to sleep. Studies show that 2 hours of screen exposure before bed can suppress melatonin by up to 50% and delay sleep onset by 1-3 hours.\n\nBut the bigger mechanism is cognitive arousal. Social media, news, email — all of it activates your threat-detection systems and keeps your prefrontal cortex firing. Your brain cannot distinguish between a "threatening" Twitter thread and an actual threat. The result is elevated cortisol and adrenaline at exactly the moment your body needs to wind down.\n\nThe 10:30 PM cutoff gives your nervous system a 60-90 minute buffer before typical sleep. This window is where the research shows the biggest sleep quality improvements. Better sleep architecture means more deep sleep and REM — the stages responsible for memory consolidation, emotional regulation, and physical repair.'
    },
    {
      key: 'steps', icon: '👟', label: 'Daily steps / movement', type: 'CORE', color: '#4A7A68',
      hook: 'The dose-response curve between movement and mortality is one of the clearest in all of medicine.',
      science: 'A landmark study following over 16,000 older women found that those taking 7,500 steps per day had a 65% lower mortality rate than those taking 2,700 steps. The benefits plateau around 10,000 steps — which is why our tiers are set at 5,000, 7,500, and 10,000.\n\nBeyond longevity, daily movement drives neurogenesis — the growth of new brain cells — primarily in the hippocampus, the region responsible for learning and memory. This effect is amplified when movement is habitual rather than sporadic. Even brisk walking for 30 minutes increases BDNF (brain-derived neurotrophic factor), often called "Miracle-Gro for the brain."\n\nFor those who prefer structured physical activity over step counting, 30 minutes of elevated heart rate exercise produces equivalent or superior cardiovascular and cognitive benefits — which is why Niyama offers both options.'
    },
    {
      key: 'meditation', icon: '🧘', label: 'Meditation / mindfulness', type: 'LIBRARY', color: '#6B7280',
      hook: '10 minutes a day measurably changes the structure of your brain within 8 weeks.',
      science: 'Neuroimaging studies from Harvard Medical School have shown that consistent meditation — as little as 10 minutes daily over 8 weeks — produces measurable increases in grey matter density in the prefrontal cortex (decision-making, focus) and decreases in the amygdala (stress reactivity).\n\nMeta-analyses of mindfulness-based interventions consistently show significant reductions in anxiety, depression, and chronic pain. The mechanism is regulation of the default mode network — the brain\'s "wandering mind" state associated with rumination and self-referential negative thinking.\n\nFor performance, meditation improves sustained attention, working memory, and cognitive flexibility. A study of US Marines preparing for deployment found that mindfulness training significantly improved working memory capacity and emotional regulation under extreme stress. The practice scales — what works in combat conditions works in daily life.'
    },
    {
      key: 'screen_time', icon: '📱', label: 'Screen time under 3 hours', type: 'LIBRARY', color: '#6B7280',
      hook: 'Recreational screen time above 3 hours daily correlates with measurable mental health decline.',
      science: 'Longitudinal research by psychologist Jonathan Haidt and others has tracked the correlation between rising smartphone use and declining mental health, particularly in adolescents — but the effects are not age-limited. Heavy recreational screen use (social media, passive video consumption) is associated with increased anxiety, depression, loneliness, and reduced life satisfaction across age groups.\n\nThe mechanism is multifaceted: social comparison activates the brain\'s threat systems; intermittent variable reward (likes, notifications) creates dopamine dysregulation similar to gambling; and passive consumption crowds out active, restorative activities like conversation, movement, and sleep.\n\nThe 3-hour threshold is a meaningful boundary — below it, screen use shows minimal negative effects. Above it, the data curves sharply. This habit is about reclaiming your attention — the most finite and most undervalued resource you have.'
    },
    {
      key: 'reading', icon: '📚', label: 'Read for 30 minutes', type: 'LIBRARY', color: '#6B7280',
      hook: 'Reading for 6 minutes reduces cortisol more effectively than a walk or listening to music.',
      science: 'A University of Sussex study found that reading reduced stress by 68% in under 6 minutes — faster than music (61%), tea or coffee (54%), or taking a walk (42%). The researchers attributed this to the immersive nature of reading, which forces cognitive focus and interrupts the rumination loops that sustain stress.\n\nBeyond stress, sustained reading builds what researchers call "cognitive reserve" — a buffer of neural connections that protects against age-related cognitive decline. People who read regularly throughout their lives have later onset of Alzheimer\'s symptoms, even with equivalent amyloid plaque burden.\n\nFor the 30-minute habit, the key is sustained, focused reading rather than scrolling or skimming. The goal is deep reading — the kind that builds attention span, vocabulary, empathy (narrative fiction specifically increases theory of mind), and the capacity to hold complex ideas.'
    },
    {
      key: 'no_food_after_8', icon: '🚫', label: 'No food after 8 PM', type: 'LIBRARY', color: '#6B7280',
      hook: 'When you eat matters almost as much as what you eat.',
      science: 'Research from the Salk Institute has established that time-restricted eating — confining food intake to a consistent daily window — activates cellular repair processes (autophagy), improves metabolic markers, and reduces inflammation. Eating late at night contradicts your circadian biology: insulin sensitivity is significantly lower in the evening, meaning the same meal eaten at 8 PM causes a larger blood sugar spike than the same meal at noon.\n\nLate eating also directly impairs sleep quality. The digestive process elevates core body temperature — the opposite of what needs to happen for deep sleep initiation. Studies show that eating within 3 hours of bedtime increases wakefulness and reduces slow-wave sleep.\n\nThe 8 PM cutoff gives a minimum 2-3 hour buffer before typical sleep and aligns eating with the period of peak insulin sensitivity. The habit doesn\'t require caloric restriction — just timing.'
    },
    {
      key: 'cold_shower', icon: '🚿', label: 'Cold shower / cold exposure', type: 'LIBRARY', color: '#6B7280',
      hook: 'Cold exposure triggers a 200-300% norepinephrine spike that lasts for hours.',
      science: 'Controlled cold exposure — even a 30-second cold shower — produces a dramatic increase in norepinephrine and dopamine. Research from the Thrombosis Research Institute found that regular cold shower practitioners showed increased levels of circulating monocytes — immune cells that fight infection — compared to controls.\n\nThe norepinephrine spike from cold is clinically significant: it improves mood, focus, energy, and pain tolerance for several hours after exposure. This is the same neurotransmitter targeted by many antidepressant medications. Cold exposure activates it rapidly and without pharmacological intervention.\n\nFor metabolic health, cold activates brown adipose tissue (BAT) — a type of fat that generates heat by burning calories. Regular cold exposure increases BAT density and metabolic rate. The adaptation process also builds what researchers describe as stress inoculation — controlled acute stress that strengthens the body\'s regulatory systems.'
    },
    {
      key: 'gratitude', icon: '📓', label: 'Gratitude journaling', type: 'LIBRARY', color: '#6B7280',
      hook: 'Writing three things you\'re grateful for before sleep measurably improves sleep quality.',
      science: 'Research from UC Davis and the University of Pennsylvania has shown that gratitude journaling produces consistent, measurable improvements in psychological well-being, life satisfaction, and optimism. The effect size in well-designed studies is comparable to short-term therapy for mild depression.\n\nAt a neurological level, gratitude activates the hypothalamus — which regulates sleep, metabolism, and stress — and stimulates dopamine release in the basal ganglia. The act of writing (versus just thinking) appears to strengthen these effects by engaging working memory and forcing specificity.\n\nFor sleep specifically, a 2019 study found that writing a to-do list or gratitude list before bed significantly reduced the time to fall asleep compared to journaling about the day\'s events. The mechanism is offloading — transferring concerns and intentions from working memory onto paper, freeing the mind for sleep.'
    },
    {
      key: 'no_alcohol', icon: '🚫🍷', label: 'No alcohol', type: 'LIBRARY', color: '#6B7280',
      hook: 'Even one drink suppresses REM sleep by up to 24%.',
      science: 'Alcohol is the most widely consumed substance that directly impairs sleep architecture. Even moderate amounts (1-2 drinks) suppress REM sleep — the stage responsible for emotional processing, memory consolidation, and creative thinking — by 24% in the first half of the night. The result is a "sleep debt" that accumulates invisibly: you may sleep the same number of hours but wake less restored.\n\nBeyond sleep, alcohol is a significant stressor on the liver, gut microbiome, and cardiovascular system. Recent re-analyses of the "light drinking is protective" literature have found that many of those findings were confounded by including ex-drinkers (who stopped due to illness) in the abstinent category. The revised picture is closer to a linear dose-response relationship: less alcohol, better outcomes across almost all health metrics.\n\nThe habit here is binary by design. Tracking "moderate" drinking is cognitively complex. Tracking zero is simple — and the research on habit formation strongly favors bright-line rules over moderated targets.'
    },
    {
      key: 'healthy_eating', icon: '🥗', label: 'Healthy eating today', type: 'LIBRARY', color: '#6B7280',
      hook: '90% of your serotonin is made in your gut, not your brain.',
      science: 'The gut-brain axis is one of the most significant recent discoveries in neuroscience. Your gut microbiome produces and regulates neurotransmitters — including 90% of the body\'s serotonin — that directly influence mood, cognition, and mental health. Dietary quality is the primary modifiable determinant of microbiome composition.\n\nLarge-scale epidemiological studies (including the SMILES trial, the first RCT of dietary intervention for depression) have found that dietary improvement is a clinically effective intervention for moderate depression, with effect sizes comparable to pharmacotherapy. The Mediterranean dietary pattern — high in plants, olive oil, fish, and whole grains — shows the strongest and most consistent associations with both mental and physical health outcomes.\n\nFor daily tracking, the habit is intentionally simple: did you make predominantly whole-food, nutrient-dense choices today? The goal is not perfection or calorie counting — it\'s building the daily intention to eat in a way that serves your biology.'
    },
    {
      key: 'strength_training', icon: '💪', label: 'Strength training', type: 'LIBRARY', color: '#6B7280',
      hook: 'Resistance training releases BDNF — the brain\'s most important growth factor.',
      science: 'Strength training is one of the most underrated cognitive and longevity interventions available. During and after resistance exercise, muscles release myokines — signaling proteins that cross the blood-brain barrier and stimulate the production of BDNF (brain-derived neurotrophic factor), sometimes described as "Miracle-Gro for the brain." BDNF drives neurogenesis, improves learning, and is protective against cognitive decline.\n\nFor physical health, resistance training is the primary intervention for maintaining muscle mass (which declines ~3-5% per decade from age 30 without intervention), bone density, and metabolic rate. Studies show that higher muscle mass in midlife is the strongest single predictor of functional independence in old age.\n\nThe longevity data is striking: a 2022 study of over 80,000 adults found that strength training 1-2 times per week was associated with a 10-17% lower risk of all-cause mortality, cardiovascular disease, and cancer — effects that were independent of and additive to aerobic exercise.'
    },
    {
      key: 'sunlight', icon: '☀️', label: 'Morning sunlight (10+ min)', type: 'LIBRARY', color: '#6B7280',
      hook: 'Morning light exposure in the first hour after waking sets your cortisol peak — and every energy cycle that follows.',
      science: 'Light is the primary zeitgeber — "time giver" — for your circadian system. Specifically, morning sunlight viewed within 30-60 minutes of waking triggers the cortisol awakening response (CAR), a natural peak in cortisol that primes alertness, focus, and mood for the subsequent 12-16 hours.\n\nResearch from Andrew Huberman\'s lab at Stanford and others has shown that outdoor light exposure in the morning — even on overcast days — provides 10,000-100,000 lux of light intensity, far exceeding the 1,000-2,000 lux of indoor lighting. This intensity is needed to fully activate the retinal ganglion cells that set the circadian clock. Indoor light in the morning produces a significantly weaker circadian signal.\n\nThe downstream effects cascade: morning light exposure improves nighttime melatonin onset, reduces sleep latency, and improves sleep quality. It also directly stimulates serotonin synthesis — morning light is one of the most effective and side-effect-free interventions for seasonal and non-seasonal depression.'
    },
    {
      key: 'stretching', icon: '🤸', label: 'Stretching or yoga (15+ min)', type: 'LIBRARY', color: '#6B7280',
      hook: 'Mobility is the most neglected predictor of longevity — and it\'s almost entirely modifiable.',
      science: 'Longevity researcher Peter Attia and others have highlighted that the ability to get up and down from the floor unassisted is one of the strongest single predictors of 10-year mortality in adults over 50 — outperforming many traditional biomarkers. Mobility is trainable, and the window to build it is now.\n\nFor the nervous system, stretching and yoga activate the parasympathetic nervous system — the "rest and digest" state — via stimulation of mechanoreceptors in muscles and fascia. A 2018 meta-analysis found that yoga practice significantly reduced cortisol and inflammatory markers, with effect sizes comparable to moderate aerobic exercise.\n\nBeyond longevity and stress, regular flexibility work reduces injury risk, improves posture and breathing mechanics, and maintains the range of motion needed for pain-free daily function. The 15-minute threshold is the minimum effective dose established in the research for producing measurable improvements in range of motion over 4-8 weeks of consistent practice.'
    },
  ]

  const coreHabits = habits.filter(h => h.type === 'CORE')
  const libraryHabits = habits.filter(h => h.type === 'LIBRARY')

  function HabitCard({ habit }) {
    const isOpen = expanded === habit.key
    return (
      <div style={{ background: 'var(--theme-card)', border: `1px solid ${isOpen ? 'var(--theme-primary)' : 'var(--theme-border)'}`, borderRadius: '14px', marginBottom: '10px', overflow: 'hidden', transition: 'border-color 0.15s' }}>
        <button onClick={() => setExpanded(isOpen ? null : habit.key)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>{habit.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)', margin: 0 }}>{habit.label}</p>
              <span style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '6px', background: habit.type === 'CORE' ? 'var(--theme-primary)' : 'var(--theme-bg)', color: habit.type === 'CORE' ? 'white' : 'var(--theme-text-muted)', border: habit.type === 'CORE' ? 'none' : '1px solid var(--theme-border)' }}>{habit.type}</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--theme-primary)', margin: 0, fontStyle: 'italic', lineHeight: '1.4' }}>{habit.hook}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--theme-text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {isOpen && (
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--theme-border)' }}>
            <div style={{ height: '12px' }} />
            {habit.science.split('\n\n').map((para, i, arr) => (
              <p key={i} style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.75', margin: i < arr.length - 1 ? '0 0 12px' : 0 }}>{para}</p>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <SubScreen title="The Science" onBack={onBack}>
      <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: 'var(--theme-primary)', lineHeight: '1.5', margin: 0 }}>
          🔬 <strong>Tap any habit</strong> to read the research behind it. These aren't wellness trends — each habit has robust scientific evidence spanning multiple independent studies.
        </p>
      </div>

      <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', paddingLeft: '2px' }}>Core Habits — always tracked</p>
      {coreHabits.map(h => <HabitCard key={h.key} habit={h} />)}

      <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px', marginTop: '20px', paddingLeft: '2px' }}>Library Habits — you choose 4</p>
      {libraryHabits.map(h => <HabitCard key={h.key} habit={h} />)}
    </SubScreen>
  )
}

// ─── 3c. How It Works ──────────────────────────────────────────────────────────
function HowItWorksScreen({ onBack, card }) {
  return (
    <SubScreen title="How It Works" onBack={onBack}>
      {[
        {
          step: '1', icon: '✅', title: 'Track 9 daily habits',
          body: 'Every day you track up to 9 habits: 3 core habits (always the same), 4 library habits (you choose from 10), and up to 2 custom habits depending on your tier.\n\nCore habits carry 100 points each. Library and custom habits carry 50 points each. The maximum you can earn in a single day is 750 points.',
        },
        {
          step: '2', icon: '🏆', title: 'What makes a successful day',
          body: 'A successful day requires completing any 5 of your 9 habits, with at least 2 being core habits.\n\nA perfect day is all 9 habits completed. Perfect days unlock the Premium perfect month bonus.\n\nAn inactive day is when you don\'t open the app at all. 5 or more consecutive inactive days in a month makes you ineligible for that month\'s reward.',
        },
        {
          step: '3', icon: '📊', title: 'Points and your reward',
          body: '1,000 points = $1.00 in rewards. Your reward is calculated at the end of each month based on your total points, subject to your tier\'s cap.\n\nPlus and Premium tiers unlock milestone bonuses: extra rewards for hitting 10 or 20 successful days, a successful month (every submitted day is successful), or a perfect month (every day is perfect).',
        },
        {
          step: '4', icon: '🎁', title: 'How you receive your reward',
          body: 'On the 1st of each month, if you\'ve met your minimum days and earned at least 1 point, your reward is automatically calculated and sent as an electronic gift card to your email via Tremendous.\n\nAvailable brands include Amazon, Starbucks, Nike, Apple, Target, and more. All rewards are gift cards — no cash transfers, no bank details required.',
        },
        {
          step: '5', icon: '🧊', title: 'Streak freeze',
          body: 'Plus and Premium members get one streak freeze per month. Using a freeze on a day you miss preserves your streak as if you had submitted.\n\nStreak freezes do not count as a successful day — they only protect your streak number. They reset on the 1st of each month. Unused freezes do not roll over.',
        },
        {
          step: '6', icon: '🔄', title: 'Changing your habits',
          body: 'You can change your 4 library habits and custom habits once every 30 days. This lock exists because real habit formation requires consistency — changing habits too frequently undermines the process.\n\nYour wake time can be updated anytime. Your movement preference (steps vs activity) is part of the habit lock.',
        },
      ].map((item, i) => (
        <div key={i} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
              {item.icon}
            </div>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)', margin: 0 }}>{item.title}</p>
          </div>
          {item.body.split('\n\n').map((para, j, arr) => (
            <p key={j} style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.7', margin: j < arr.length - 1 ? '0 0 10px' : 0 }}>{para}</p>
          ))}
        </div>
      ))}
    </SubScreen>
  )
}

// ─── 4. Your Plan & Rewards ────────────────────────────────────────────────────
function PlanRewardsSection({ onBack, profile, card, effectiveTier, tierConfig }) {
  const maxCap = tierConfig?.max_cap || tierConfig?.reward_cap || 0
  const minDays = tierConfig?.min_days || 0

  return (
    <SubScreen title="Your Plan & Rewards" onBack={onBack}>
      {/* Current tier hero */}
      <div style={{ background: 'linear-gradient(135deg, #3D6B5A, #4A7A68)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 4px' }}>Your current plan</p>
        <p style={{ fontSize: '28px', fontWeight: '800', color: 'white', margin: '0 0 4px' }}>{tierConfig?.label || 'Free'}</p>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 12px' }}>
          {maxCap > 0 ? `Up to $${maxCap.toFixed(2)}/month · ${minDays} successful days minimum` : 'Complete onboarding to start earning'}
        </p>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', margin: 0 }}>1,000 points = $1.00 · Max 750 pts/day · Rewards paid on the 1st</p>
        </div>
      </div>

      {/* Tier comparison */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>All plans</p>
        {[
          { key: 'free_trial', label: 'Free', max: 2.50, min: 10, price: 'Free (first 3 months)', bonuses: null },
          { key: 'basic', label: 'Basic', max: 5.00, min: 10, price: '$0.99/mo', bonuses: null },
          { key: 'plus', label: 'Plus', max: 17.50, min: 7, price: '$4.99/mo', bonuses: '+$2.50 at 20 days · +$5.00 successful month' },
          { key: 'premium', label: 'Premium', max: 45.00, min: 5, price: '$14.99/mo', bonuses: '+$2.50 at 10d · +$5.00 at 20d · +$7.50 successful month · +$7.50 perfect month' },
        ].map((t, i) => {
          const isCurrent = effectiveTier === t.key || (effectiveTier === 'free_expired' && t.key === 'free_trial')
          return (
            <div key={i} style={{ background: isCurrent ? 'var(--theme-primary-light)' : 'var(--theme-bg)', border: `1px solid ${isCurrent ? 'var(--theme-primary)' : 'var(--theme-border)'}`, borderRadius: '12px', padding: '12px 14px', marginBottom: i < 3 ? '8px' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: t.bonuses ? '6px' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)', margin: 0 }}>{t.label}</p>
                  {isCurrent && <span style={{ fontSize: '10px', background: 'var(--theme-primary)', color: 'white', padding: '1px 7px', borderRadius: '8px', fontWeight: '700' }}>Your plan</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: isCurrent ? 'var(--theme-primary)' : 'var(--theme-text)', margin: '0 0 1px' }}>Up to ${t.max.toFixed(2)}/mo</p>
                  <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', margin: 0 }}>{t.price} · {t.min} days min</p>
                </div>
              </div>
              {t.bonuses && <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', lineHeight: '1.4', margin: 0 }}>🎯 {t.bonuses}</p>}
            </div>
          )
        })}
      </div>

      {/* How rewards work */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>How rewards work</p>
        {[
          { icon: '📊', title: 'Earn points daily', desc: 'Complete habits to earn up to 750 pts/day. Core = 100 pts, library/custom = 50 pts.' },
          { icon: '📅', title: 'Hit your minimum days', desc: `${minDays || 10} successful days to qualify. Successful day = 5 of 9 habits (at least 2 core).` },
          { icon: '🎁', title: 'Gift card on the 1st', desc: 'Automatically sent via Tremendous on the 1st. Amazon, Starbucks, Nike, Apple, and more.' },
          { icon: '📵', title: 'Stay active', desc: '5+ consecutive inactive days = ineligible that month. Submit daily to stay eligible.' },
          { icon: '🔒', title: 'Gift cards only', desc: 'All rewards are electronic gift cards. No cash transfers, no bank details required.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: i < 4 ? '14px' : 0 }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)', margin: '0 0 2px' }}>{item.title}</p>
              <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.5', margin: 0 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Referral bonus */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Referral bonus</p>
        {[
          { icon: '📤', title: 'Share your code', desc: 'Send your unique referral code to a friend.' },
          { icon: '✅', title: 'They join on a paid plan', desc: 'Your friend creates an account and selects a paid tier.' },
          { icon: '🎯', title: 'They hit a successful day', desc: 'Referral confirmed once they complete their first successful day.' },
          { icon: '🎁', title: 'Both of you earn', desc: 'Your monthly reward cap increases by $2.50. So does theirs. Max 20 referrals/year.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: i < 3 ? '12px' : 0 }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)', margin: '0 0 2px' }}>{item.title}</p>
              <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.4', margin: 0 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SubScreen>
  )
}

// ─── 5. Billing ────────────────────────────────────────────────────────────────
function BillingSection({ onBack, profile, userId, card, saving, setSaving, showMessage, effectiveTier, tierConfig }) {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [billing, setBilling] = useState('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const isFree = effectiveTier === 'free_trial' || effectiveTier === 'free_expired'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      showMessage('🎉 Subscription activated!')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function startCheckout(tier, billingCycle) {
    setCheckoutLoading(true)
    try {
      trackEvent(supabase, userId, 'checkout_started', { tier, billing: billingCycle, from_tier: effectiveTier })
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billing: billingCycle, userId, userEmail: profile?.email })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showMessage('Could not start checkout. Please try again.', 'error')
    } catch (e) { showMessage('Could not start checkout. Please try again.', 'error') }
    setCheckoutLoading(false)
  }

  const UPGRADE_TIERS = [
    { key: 'basic', label: 'Basic', monthly: '$0.99', annual: '$9.99', maxCap: '$5.00', minDays: 10, customSlots: 1 },
    { key: 'plus', label: 'Plus', monthly: '$4.99', annual: '$49.99', maxCap: '$17.50', minDays: 7, customSlots: 2, badge: 'Popular' },
    { key: 'premium', label: 'Premium', monthly: '$14.99', annual: '$149.99', maxCap: '$45.00', minDays: 5, customSlots: 2, badge: 'Best value' },
  ]

  return (
    <SubScreen title="Billing" onBack={onBack}>
      {/* Current plan */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Current plan</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <p style={{ fontSize: '22px', fontWeight: '800', color: 'var(--theme-text)', margin: '0 0 2px' }}>{tierConfig?.label || 'Free'}</p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', margin: 0 }}>
              {isFree ? 'Free plan' : `$${tierConfig?.price}/month${profile?.billing_cycle === 'annual' ? ' (annual billing)' : ''}`}
            </p>
            {profile?.subscription_status === 'past_due' && (
              <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0', fontWeight: '600' }}>⚠️ Payment past due — update your billing details</p>
            )}
          </div>
          <span style={{ background: 'var(--theme-primary)', color: 'white', fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '20px' }}>
            {tierConfig?.label || 'Free'}
          </span>
        </div>
        {isFree ? (
          <button onClick={() => setShowUpgrade(true)}
            style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            Upgrade to a paid plan
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowUpgrade(true)}
              style={{ flex: 1, background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)', fontWeight: '700', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Change plan
            </button>
            <button onClick={() => window.open('https://billing.stripe.com/p/login/test', '_blank')}
              style={{ flex: 1, background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Manage billing ↗
            </button>
          </div>
        )}
      </div>

      {/* Billing info */}
      {!isFree && (
        <div style={card}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Billing details</p>
          {[
            { label: 'Billing cycle', value: profile?.billing_cycle === 'annual' ? 'Annual' : 'Monthly' },
            { label: 'Status', value: profile?.subscription_status === 'active' ? '✅ Active' : profile?.subscription_status === 'past_due' ? '⚠️ Past due' : profile?.subscription_status || '—' },
            { label: 'Next renewal', value: profile?.current_period_end ? new Date(profile.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—' },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--theme-border)' : 'none' }}>
              <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...card, background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)' }}>
        <p style={{ fontSize: '12px', color: 'var(--theme-primary)', lineHeight: '1.6', margin: 0 }}>
          💳 <strong>Payments are processed securely by Stripe.</strong> Niyama Life never stores your payment details. All rewards are issued as electronic gift cards via Tremendous.
        </p>
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowUpgrade(false) }}>
          <div style={{ background: 'var(--theme-bg)', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '448px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)', margin: 0 }}>Choose a plan</h3>
              <button onClick={() => setShowUpgrade(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--theme-text-muted)', padding: '4px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '10px', padding: '3px', marginBottom: '16px' }}>
              {['monthly', 'annual'].map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: billing === b ? 'var(--theme-primary)' : 'transparent', color: billing === b ? 'white' : 'var(--theme-text-muted)', fontWeight: billing === b ? '700' : '400', fontSize: '13px', transition: 'all 0.15s' }}>
                  {b === 'monthly' ? 'Monthly' : 'Annual'}
                  {b === 'annual' && <span style={{ marginLeft: '6px', fontSize: '10px', background: billing === 'annual' ? 'rgba(255,255,255,0.2)' : 'var(--theme-primary-light)', color: billing === 'annual' ? 'white' : 'var(--theme-primary)', padding: '1px 6px', borderRadius: '8px', fontWeight: '700' }}>Save ~17%</span>}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {UPGRADE_TIERS.map(t => {
                const isCurrent = effectiveTier === t.key
                const isSelected = selectedTier === t.key
                const price = billing === 'annual' ? t.annual : t.monthly
                return (
                  <button key={t.key} onClick={() => !isCurrent && setSelectedTier(t.key)}
                    style={{ background: isCurrent ? 'var(--theme-bg)' : isSelected ? 'var(--theme-primary-light)' : 'var(--theme-card)', border: `2px solid ${isCurrent ? 'var(--theme-border)' : isSelected ? 'var(--theme-primary)' : 'var(--theme-border)'}`, borderRadius: '14px', padding: '14px 16px', cursor: isCurrent ? 'default' : 'pointer', textAlign: 'left', opacity: isCurrent ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--theme-text)', margin: 0 }}>{t.label}</p>
                          {t.badge && <span style={{ fontSize: '10px', fontWeight: '700', background: 'var(--theme-primary-light)', color: 'var(--theme-primary)', padding: '1px 7px', borderRadius: '8px' }}>{t.badge}</span>}
                          {isCurrent && <span style={{ fontSize: '10px', fontWeight: '700', background: 'var(--theme-border)', color: 'var(--theme-text-muted)', padding: '1px 7px', borderRadius: '8px' }}>Current</span>}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', margin: 0 }}>{t.customSlots} custom slot{t.customSlots > 1 ? 's' : ''} · min {t.minDays} days/mo</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)', lineHeight: 1, margin: '0 0 2px' }}>{price}</p>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-primary)', margin: 0 }}>Up to {t.maxCap}/mo</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => selectedTier && startCheckout(selectedTier, billing)} disabled={!selectedTier || checkoutLoading}
              style={{ width: '100%', background: selectedTier ? 'var(--theme-primary)' : 'var(--theme-border)', color: selectedTier ? 'white' : 'var(--theme-text-muted)', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: selectedTier ? 'pointer' : 'not-allowed', fontSize: '15px', opacity: checkoutLoading ? 0.7 : 1 }}>
              {checkoutLoading ? 'Redirecting...' : selectedTier ? `Subscribe to ${UPGRADE_TIERS.find(t => t.key === selectedTier)?.label}` : 'Select a plan'}
            </button>
          </div>
        </div>
      )}
    </SubScreen>
  )
}

// ─── 6. Preferences ────────────────────────────────────────────────────────────
function PreferencesSection({ onBack, profile, userId, card, saving, setSaving, showMessage, onRefresh }) {
  const [theme, setTheme] = useState(profile?.color_theme || 'sage')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [middayNudge, setMiddayNudge] = useState(profile?.email_reminders ?? true)
  const [streakProtection, setStreakProtection] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if ('Notification' in window) setPushEnabled(Notification.permission === 'granted')
  }, [])

  async function saveTheme() {
    setSaving(true)
    await supabase.from('profiles').update({ color_theme: theme }).eq('id', userId)
    applyTheme(theme)
    showMessage('Theme updated.')
    onRefresh()
    setSaving(false)
  }

  async function requestPush() {
    setRequesting(true)
    const permission = await Notification.requestPermission()
    setPushEnabled(permission === 'granted')
    if (permission === 'granted') { showMessage('Push notifications enabled.'); window.posthog?.capture('push_notifications_enabled') }
    setRequesting(false)
  }

  async function saveNotifications() {
    setSaving(true)
    await supabase.from('profiles').update({ email_reminders: middayNudge }).eq('id', userId)
    showMessage('Notification preferences saved.')
    setSaving(false)
  }

  return (
    <SubScreen title="Preferences" onBack={onBack}>
      {/* Theme */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>App theme</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {[
            { key: 'sage', label: 'Sage Green', bg: '#F4F7F5', primary: '#4A7A68' },
            { key: 'salmon', label: 'Salmon Pink', bg: '#F7F4F4', primary: '#C96A52' },
          ].map(t => (
            <button key={t.key} onClick={() => setTheme(t.key)}
              style={{ padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', background: t.bg, border: `2px solid ${theme === t.key ? t.primary : 'var(--theme-border)'}` }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: t.primary, margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px', fontWeight: '600', color: theme === t.key ? t.primary : 'var(--theme-text-secondary)', margin: '0 0 2px' }}>{t.label}</p>
              {theme === t.key && <p style={{ fontSize: '10px', color: t.primary, margin: 0 }}>✓ Active</p>}
            </button>
          ))}
        </div>
        <button onClick={saveTheme} disabled={saving}
          style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '11px', borderRadius: '10px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save theme'}
        </button>
      </div>

      {/* Push notifications */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Push notifications</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)', margin: '0 0 2px' }}>Enable push notifications</p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', margin: 0 }}>Wake alerts, evening reminders, gift card delivery</p>
          </div>
          <button onClick={pushEnabled ? undefined : requestPush} disabled={requesting}
            style={{ background: pushEnabled ? 'var(--theme-primary)' : 'var(--theme-border)', border: 'none', borderRadius: '20px', padding: '6px 14px', cursor: pushEnabled ? 'default' : 'pointer', color: pushEnabled ? 'white' : 'var(--theme-text-muted)', fontSize: '12px', fontWeight: '600', flexShrink: 0, marginLeft: '12px' }}>
            {requesting ? '...' : pushEnabled ? '✓ On' : 'Enable'}
          </button>
        </div>
        {!('Notification' in window) && (
          <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '8px 12px' }}>
            <p style={{ fontSize: '11px', color: '#92400e', margin: 0 }}>Push notifications require the native app — coming soon on iOS and Android.</p>
          </div>
        )}
      </div>

      {/* Notification preferences */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>Notification preferences</p>
        {[
          { label: 'Midday nudge', desc: 'Personalized reminder at noon based on your incomplete habits', value: middayNudge, onChange: setMiddayNudge },
          { label: 'Streak protection', desc: 'Reminder at 10 PM if you haven\'t submitted today', value: streakProtection, onChange: setStreakProtection },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: i < 1 ? '16px' : '0' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)', margin: '0 0 2px' }}>{item.label}</p>
              <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', lineHeight: '1.4', margin: 0 }}>{item.desc}</p>
            </div>
            <button onClick={() => item.onChange(!item.value)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: item.value ? 'var(--theme-primary)' : 'var(--theme-border)', position: 'relative', flexShrink: 0, transition: 'background 0.15s' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: item.value ? '23px' : '3px', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        ))}
        <button onClick={saveNotifications} disabled={saving}
          style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '11px', borderRadius: '10px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', marginTop: '16px', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>

      {/* App version */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>App info</p>
        {[
          { label: 'Version', value: 'v2.0.0' },
          { label: 'Platform', value: 'Web (PWA)' },
          { label: 'Native app', value: 'Coming soon — iOS & Android' },
        ].map((item, i, arr) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--theme-border)' : 'none' }}>
            <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>{item.value}</span>
          </div>
        ))}
      </div>
    </SubScreen>
  )
}

// ─── 7. Legal & Trust ──────────────────────────────────────────────────────────
function LegalSection({ onBack, card, profile }) {
  return (
    <SubScreen title="Legal & Trust" onBack={onBack}>
      {/* About */}
      <div style={{ ...card, background: 'linear-gradient(135deg, #3D6B5A, #4A7A68)', border: 'none' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 6px' }}>About</p>
        <p style={{ fontSize: '16px', fontWeight: '800', color: 'white', margin: '0 0 4px' }}>Niyama Life Inc.</p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', margin: '0 0 10px' }}>Delaware C-Corporation · Incorporated 2026</p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', margin: '0 0 10px' }}>
          Niyama Life Inc. is a behaviour change platform that rewards users financially for completing science-backed daily habits. Headquartered in Mountain View, California.
        </p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>info@niyamalife.com · niyamalife.com</p>
      </div>

      {/* Legal documents */}
      <SectionCard>
        {[
          { label: 'Terms of Service', url: 'https://www.niyamalife.com/terms', icon: '📄' },
          { label: 'Privacy Policy', url: 'https://www.niyamalife.com/privacy', icon: '🔒' },
          { label: 'Cookie Policy', url: 'https://www.niyamalife.com/privacy#cookies', icon: '🍪' },
        ].map((item, i) => (
          <SettingsRow key={i} icon={item.icon} label={item.label} onPress={() => window.open(item.url, '_blank')} />
        ))}
      </SectionCard>

      {/* Age & minor policy */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Age & minor policy</p>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.7', marginBottom: '10px' }}>
          Niyama Life is open to all ages. However, users under 18 are classified as minors and subject to the following restrictions:
        </p>
        {[
          'Minors are automatically placed on the Free tier and cannot upgrade to a paid subscription.',
          'Minors cannot receive financial rewards, gift cards, or any monetary compensation.',
          'Minors cannot participate in the referral program or social sharing rewards.',
          'These restrictions exist to comply with financial regulations and protect minors from financial incentive mechanisms.',
        ].map((point, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < 3 ? '8px' : 0 }}>
            <span style={{ fontSize: '12px', color: 'var(--theme-primary)', flexShrink: 0, marginTop: '1px' }}>•</span>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', margin: 0 }}>{point}</p>
          </div>
        ))}
        {profile?.is_minor && (
          <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '8px', padding: '10px 12px', marginTop: '12px' }}>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>👋 Your account is classified as a minor account. These restrictions apply to you. They will be removed automatically when you turn 18.</p>
          </div>
        )}
      </div>

      {/* Trust signals */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>How we protect you</p>
        {[
          { icon: '🔐', label: 'Secure payments', desc: 'All payments processed by Stripe. Niyama never stores payment details.' },
          { icon: '🎁', label: 'Gift cards only', desc: 'Rewards are electronic gift cards via Tremendous — no cash transfers.' },
          { icon: '📧', label: 'No spam', desc: 'We only send habit reminders and gift card delivery emails.' },
          { icon: '🗑️', label: 'Your data', desc: 'You can delete your account anytime. Data is permanently purged after 30 days.' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: i < 3 ? '12px' : 0 }}>
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)', margin: '0 0 2px' }}>{item.label}</p>
              <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.4', margin: 0 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </SubScreen>
  )
}

// ─── 8. Account ────────────────────────────────────────────────────────────────
function AccountSection({ onBack, profile, userId, card, saving, setSaving, showMessage, onSignOut, effectiveTier, tierConfig, streak }) {
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteStep, setDeleteStep] = useState(0)
  const [showPauseConfirm, setShowPauseConfirm] = useState(false)

  const isFree = effectiveTier === 'free_trial' || effectiveTier === 'free_expired'

  async function pauseAccount() {
    setSaving(true)
    const { error } = await supabase.rpc('request_pause', { p_user_id: userId })
    if (error) showMessage('Could not pause. Please contact support.', 'error')
    else { showMessage('Pause scheduled for the 1st of next month.'); window.posthog?.capture('account_paused') }
    setShowPauseConfirm(false)
    setSaving(false)
  }

  async function deleteAccount() {
    if (deleteInput !== 'DELETE') return
    setSaving(true)
    window.posthog?.capture('account_deleted')
    window.posthog?.reset()
    await supabase.rpc('delete_user', { user_id: userId })
    await supabase.auth.signOut()
    setSaving(false)
  }

  return (
    <SubScreen title="Account" onBack={onBack}>
      {/* Identity card */}
      <div style={card}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Signed in as</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>{(profile?.full_name || 'U')[0].toUpperCase()}</span>
          </div>
          <div>
            <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)', margin: '0 0 2px' }}>{profile?.full_name || '—'}</p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', margin: 0 }}>{profile?.email || '—'}</p>
          </div>
        </div>
        {[
          { label: 'Phone', value: profile?.phone || 'Not provided' },
          { label: 'Plan', value: `${tierConfig?.label || 'Free'}${isFree ? '' : ` · ${profile?.billing_cycle === 'annual' ? 'Annual' : 'Monthly'}`}` },
          { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
        ].map((item, i, arr) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--theme-border)' }}>
            <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div style={card}>
        <button onClick={onSignOut}
          style={{ width: '100%', background: 'none', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontWeight: '600', padding: '13px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>
          Sign out
        </button>
      </div>

      {/* Pause */}
      {!isFree && (
        <div style={card}>
          <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--theme-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Pause account</p>
          <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
            Pause for 1 month — once per year. No billing. No rewards. Your streak and all data are preserved.
          </p>
          {!showPauseConfirm ? (
            <button onClick={() => setShowPauseConfirm(true)}
              style={{ width: '100%', background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', fontWeight: '600', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Pause for 1 month
            </button>
          ) : (
            <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '10px' }}>Pause scheduled for 1st of next month. Confirm?</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowPauseConfirm(false)} style={{ flex: 1, background: 'none', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button onClick={pauseAccount} disabled={saving} style={{ flex: 1, background: '#C9973A', color: 'white', fontWeight: '700', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', border: 'none' }}>
                  {saving ? '...' : 'Confirm pause'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete */}
      <div style={{ ...card, border: '1px solid #fecaca' }}>
        <p style={{ fontSize: '12px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Delete account</p>
        {deleteStep === 0 && (
          <>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', lineHeight: '1.6', marginBottom: '12px' }}>
              Your account will be deactivated immediately and permanently deleted after 30 days. You can restore it within that window by emailing support@niyamalife.com.
            </p>
            <button onClick={() => setDeleteStep(1)} style={{ width: '100%', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '600', padding: '11px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              I want to delete my account
            </button>
          </>
        )}
        {deleteStep === 1 && (
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '14px' }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>Before you go...</p>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
              You've logged <strong>{profile?.total_days_logged || 0} days</strong> and built a <strong>{streak?.current_streak || 0}-day streak</strong>. That's real progress. Are you sure?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDeleteStep(0)} style={{ flex: 1, background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', border: 'none' }}>Keep my account</button>
              <button onClick={() => setDeleteStep(2)} style={{ flex: 1, background: 'none', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Still delete</button>
            </div>
          </div>
        )}
        {deleteStep === 2 && (
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '14px' }}>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>Did you know?</p>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
              You can <strong>pause your account</strong> for 1 month instead — no billing, streak preserved. Would you like to pause instead?
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDeleteStep(0)} style={{ flex: 1, background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', border: 'none' }}>Pause instead</button>
              <button onClick={() => setDeleteStep(3)} style={{ flex: 1, background: 'none', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>No, delete</button>
            </div>
          </div>
        )}
        {deleteStep === 3 && (
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', marginBottom: '6px' }}>Type DELETE to confirm</p>
            <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '10px', lineHeight: '1.5' }}>
              Account deactivated immediately · Data deleted after 30 days · Restore: support@niyamalife.com
            </p>
            <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE"
              style={{ background: 'white', border: '1px solid #fecaca', color: 'var(--theme-text)', width: '100%', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setDeleteStep(0); setDeleteInput('') }} style={{ flex: 1, background: 'none', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={deleteAccount} disabled={deleteInput !== 'DELETE' || saving}
                style={{ flex: 1, background: deleteInput === 'DELETE' ? '#dc2626' : 'var(--theme-border)', color: deleteInput === 'DELETE' ? 'white' : 'var(--theme-text-muted)', fontWeight: '700', padding: '10px', borderRadius: '8px', cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed', fontSize: '13px', border: 'none' }}>
                {saving ? '...' : 'Delete forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </SubScreen>
  )
}