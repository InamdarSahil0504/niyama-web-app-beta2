import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { applyTheme, TIER_CONFIG, getEffectiveTier, LIBRARY_HABITS } from '../../config'
import { supabase } from '../../supabase'
import { trackEvent } from '../../config'
import posthog from 'posthog-js'

export default function SettingsTab({ session, profile, onSignOut, onRefresh }) {
  const [activeSection, setActiveSection] = useState('profile')
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
    borderRadius: '16px', padding: '20px', marginBottom: '12px',
  }

  const sections = [
    { key: 'profile', label: 'Profile', icon: '👤' },
    { key: 'habits', label: 'Habits', icon: '✅' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
    { key: 'account', label: 'Account', icon: '⚙️' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>Settings</h1>
      </div>

      {/* Section nav */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '2px' }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: activeSection === s.key ? 'var(--theme-primary)' : 'var(--theme-card)',
              border: `1px solid ${activeSection === s.key ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
              color: activeSection === s.key ? 'white' : 'var(--theme-text-secondary)',
              fontSize: '13px', fontWeight: activeSection === s.key ? '700' : '400',
              transition: 'all 0.15s',
            }}>
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Toast message */}
      {message && (
        <div style={{
          background: messageType === 'success' ? 'var(--theme-primary-light)' : '#fef2f2',
          border: `1px solid ${messageType === 'success' ? 'var(--theme-primary)' : '#fecaca'}`,
          borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
        }}>
          <p style={{ fontSize: '13px', color: messageType === 'success' ? 'var(--theme-primary)' : '#dc2626', fontWeight: '600' }}>
            {messageType === 'success' ? '✓ ' : '⚠️ '}{message}
          </p>
        </div>
      )}

      {/* Profile section */}
      {activeSection === 'profile' && (
        <ProfileSection
          profile={profile} userId={userId} card={card}
          saving={saving} setSaving={setSaving}
          showMessage={showMessage} onRefresh={onRefresh}
        />
      )}

      {/* Habits section */}
      {activeSection === 'habits' && (
        <HabitsSection
          profile={profile} userId={userId} card={card}
          saving={saving} setSaving={setSaving}
          showMessage={showMessage} onRefresh={onRefresh}
          effectiveTier={effectiveTier} tierConfig={tierConfig}
        />
      )}

      {/* Notifications section */}
      {activeSection === 'notifications' && (
        <NotificationsSection
          profile={profile} userId={userId} card={card}
          saving={saving} setSaving={setSaving}
          showMessage={showMessage}
        />
      )}

      {/* Account section */}
      {activeSection === 'account' && (
        <AccountSection
          profile={profile} userId={userId} card={card}
          saving={saving} setSaving={setSaving}
          showMessage={showMessage} onSignOut={onSignOut}
          effectiveTier={effectiveTier} tierConfig={tierConfig}
        />
      )}
    </div>
  )
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection({ profile, userId, card, saving, setSaving, showMessage, onRefresh }) {
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [theme, setTheme] = useState(profile?.color_theme || 'sage')

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      color_theme: theme,
    }).eq('id', userId)
    applyTheme(theme)
    if (error) showMessage('Failed to save. Please try again.', 'error')
    else { showMessage('Profile updated successfully.'); onRefresh() }
    setSaving(false)
  }

  const inputStyle = {
    background: 'var(--theme-bg)', border: '1px solid var(--theme-border)',
    color: 'var(--theme-text)', width: '100%', borderRadius: '10px',
    padding: '12px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div>
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
          Personal info
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '5px' }}>Full name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '5px' }}>Email</label>
          <div style={{ ...inputStyle, color: 'var(--theme-text-muted)', background: 'var(--theme-bg)', display: 'block', opacity: 0.7 }}>
            {profile?.email || session?.user?.email}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '4px' }}>Email cannot be changed.</p>
        </div>
      </div>

      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
          App theme
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { key: 'sage', label: 'Sage Green', bg: '#F4F7F5', primary: '#5A8A78' },
            { key: 'salmon', label: 'Salmon Pink', bg: '#F7F4F4', primary: '#D4735F' },
          ].map(t => (
            <button key={t.key} onClick={() => setTheme(t.key)}
              style={{
                padding: '14px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                background: t.bg,
                border: `2px solid ${theme === t.key ? t.primary : 'var(--theme-border)'}`,
              }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: t.primary, margin: '0 auto 8px' }} />
              <p style={{ fontSize: '12px', fontWeight: '600', color: theme === t.key ? t.primary : 'var(--theme-text-secondary)' }}>{t.label}</p>
              {theme === t.key && <p style={{ fontSize: '10px', color: t.primary, marginTop: '2px' }}>✓ Active</p>}
            </button>
          ))}
        </div>
      </div>

      <button onClick={saveProfile} disabled={saving}
        style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}

// ─── Habits Section ───────────────────────────────────────────────────────────
function HabitsSection({ profile, userId, card, saving, setSaving, showMessage, onRefresh, effectiveTier, tierConfig }) {
  const [userHabits, setUserHabits] = useState([])
  const [wakeMinutes, setWakeMinutes] = useState(390)
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
      setUserHabits(data)
      const libraryRows = data.filter(h => h.habit_type === 'library')
      setSelectedLibrary(libraryRows.map(h => h.habit_key))
      const customRows = data.filter(h => h.habit_type === 'custom')
      if (customRows[0]) setCustom1(customRows[0].habit_label || '')
      if (customRows[1]) setCustom2(customRows[1].habit_label || '')
      const coreRows = data.filter(h => h.habit_type === 'core')
      const wakeRow = coreRows.find(h => h.habit_key === 'wake')
      if (wakeRow?.points) setWakeMinutes(wakeRow.points) // reusing points field for wake minutes
      const stepsRow = coreRows.find(h => h.habit_key === 'steps')
      if (stepsRow?.habit_label === 'activity') setMovement('activity')
    }
    setLoading(false)
  }

  function minutesToLabel(mins) {
    const h = Math.floor(mins / 60), m = mins % 60
    const ampm = h < 12 ? 'AM' : 'PM', hour = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  function toggleLibrary(key) {
    setSelectedLibrary(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 4) return prev // must keep 4
        return prev.filter(k => k !== key)
      } else {
        if (prev.length >= 4) {
          const next = [...prev]
          next[3] = key
          return next
        }
        return [...prev, key]
      }
    })
  }

  async function saveHabits() {
    setSaving(true)
    try {
      // Delete existing and re-insert
      await supabase.from('user_habits').delete().eq('user_id', userId)
      const rows = []
      // Core habits
      rows.push({ user_id: userId, habit_type: 'core', habit_key: 'wake', habit_label: 'Wake before chosen time', is_active: true, slot_index: 0 })
      rows.push({ user_id: userId, habit_type: 'core', habit_key: 'no_phone', habit_label: 'No phone after 10:30pm', is_active: true, slot_index: 1 })
      rows.push({ user_id: userId, habit_type: 'core', habit_key: 'steps', habit_label: movement === 'activity' ? 'activity' : 'steps', is_active: true, slot_index: 2 })
      // Library habits
      selectedLibrary.slice(0, 4).forEach((key, i) => {
        const lib = LIBRARY_HABITS.find(h => h.key === key)
        rows.push({ user_id: userId, habit_type: 'library', habit_key: key, habit_label: lib?.label || key, habit_icon: lib?.icon, is_active: true, slot_index: i })
      })
      // Custom habits
      if (customSlots >= 1 && custom1.trim()) {
        rows.push({ user_id: userId, habit_type: 'custom', habit_key: 'custom_1', habit_label: custom1.trim(), is_active: true, slot_index: 0 })
      }
      if (customSlots >= 2 && custom2.trim()) {
        rows.push({ user_id: userId, habit_type: 'custom', habit_key: 'custom_2', habit_label: custom2.trim(), is_active: true, slot_index: 1 })
      }
      await supabase.from('user_habits').insert(rows)
      showMessage('Habits updated successfully.')
      onRefresh()
    } catch (e) {
      showMessage('Failed to save. Please try again.', 'error')
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '40px' }}>
      <div style={{ width: '24px', height: '24px', border: '2px solid var(--theme-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div>
      {/* Wake time */}
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Wake goal</p>
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ background: 'var(--theme-primary)', borderRadius: '14px', padding: '12px 20px', display: 'inline-block' }}>
            <p style={{ fontSize: '32px', fontWeight: '800', color: 'white', lineHeight: 1 }}>{minutesToLabel(wakeMinutes)}</p>
          </div>
        </div>
        <input type="range" min={270} max={450} step={15} value={wakeMinutes} onChange={e => setWakeMinutes(parseInt(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--theme-primary)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>4:30 AM</span>
          <span style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>7:30 AM</span>
        </div>
      </div>

      {/* Movement preference */}
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Movement habit</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { key: 'steps', label: 'Steps', icon: '👟', desc: '5k/7.5k/10k tiers' },
            { key: 'activity', label: 'Physical activity', icon: '🏃', desc: '30 min active HR' },
          ].map(opt => (
            <button key={opt.key} onClick={() => setMovement(opt.key)}
              style={{
                padding: '12px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                background: movement === opt.key ? 'var(--theme-primary)' : 'var(--theme-card)',
                border: `2px solid ${movement === opt.key ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
              }}>
              <p style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.icon}</p>
              <p style={{ fontSize: '12px', fontWeight: '700', color: movement === opt.key ? 'white' : 'var(--theme-text)' }}>{opt.label}</p>
              <p style={{ fontSize: '10px', color: movement === opt.key ? 'rgba(255,255,255,0.7)' : 'var(--theme-text-muted)', marginTop: '2px' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Library habits */}
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Your 4 habits</p>
        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '12px' }}>Select exactly 4 from the library. Changes take effect immediately.</p>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: i < selectedLibrary.length ? 'var(--theme-primary)' : 'var(--theme-border)' }} />
          ))}
          <span style={{ fontSize: '11px', color: 'var(--theme-primary)', fontWeight: '700', marginLeft: '4px' }}>{selectedLibrary.length}/4</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LIBRARY_HABITS.map(habit => {
            const isSelected = selectedLibrary.includes(habit.key)
            return (
              <button key={habit.key} onClick={() => toggleLibrary(habit.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                  borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                  background: isSelected ? 'var(--theme-primary)' : 'var(--theme-card)',
                  border: `1px solid ${isSelected ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                }}>
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
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
            Custom habits ({customSlots} slot{customSlots > 1 ? 's' : ''})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>Custom habit 1</label>
              <input type="text" value={custom1} onChange={e => setCustom1(e.target.value)} maxLength={60} placeholder="e.g. Cold shower, No sugar..."
                style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)', width: '100%', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {customSlots >= 2 && (
              <div>
                <label style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>Custom habit 2</label>
                <input type="text" value={custom2} onChange={e => setCustom2(e.target.value)} maxLength={60} placeholder="e.g. Meal prep, Journaling..."
                  style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text)', width: '100%', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={saveHabits} disabled={saving || selectedLibrary.length !== 4}
        style={{ width: '100%', background: selectedLibrary.length === 4 ? 'var(--theme-primary)' : 'var(--theme-border)', color: selectedLibrary.length === 4 ? 'white' : 'var(--theme-text-muted)', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: saving || selectedLibrary.length !== 4 ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : selectedLibrary.length === 4 ? 'Save habit settings' : 'Select exactly 4 habits'}
      </button>
    </div>
  )
}

// ─── Notifications Section ────────────────────────────────────────────────────
function NotificationsSection({ profile, userId, card, saving, setSaving, showMessage }) {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [middayNudge, setMiddayNudge] = useState(profile?.email_reminders ?? true)
  const [streakProtection, setStreakProtection] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if ('Notification' in window) {
      setPushEnabled(Notification.permission === 'granted')
    }
  }, [])

  async function requestPush() {
    setRequesting(true)
    const permission = await Notification.requestPermission()
    setPushEnabled(permission === 'granted')
    setRequesting(false)
    if (permission === 'granted') {
      showMessage('Push notifications enabled.')
      posthog.capture('push_notifications_enabled')
    }
  }

  async function saveNotifications() {
    setSaving(true)
    await supabase.from('profiles').update({ email_reminders: middayNudge }).eq('id', userId)
    showMessage('Notification preferences saved.')
    setSaving(false)
  }

  return (
    <div>
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Push notifications</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '2px' }}>Enable push notifications</p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>Wake alerts, evening reviews, gift card delivery</p>
          </div>
          <button onClick={pushEnabled ? undefined : requestPush} disabled={requesting}
            style={{ background: pushEnabled ? 'var(--theme-primary)' : 'var(--theme-border)', border: 'none', borderRadius: '20px', padding: '6px 14px', cursor: pushEnabled ? 'default' : 'pointer', color: pushEnabled ? 'white' : 'var(--theme-text-muted)', fontSize: '12px', fontWeight: '600', flexShrink: 0 }}>
            {requesting ? '...' : pushEnabled ? '✓ On' : 'Enable'}
          </button>
        </div>

        {!('Notification' in window) && (
          <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '8px 12px' }}>
            <p style={{ fontSize: '11px', color: '#92400e' }}>Push notifications require the native app. Available on iOS and Android.</p>
          </div>
        )}
      </div>

      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>Notification preferences</p>

        {[
          { label: 'Midday AI nudge', desc: 'Personalised reminder at noon based on your incomplete habits', value: middayNudge, onChange: setMiddayNudge },
          { label: 'Streak protection', desc: 'Reminder at 10pm if you haven\'t submitted today', value: streakProtection, onChange: setStreakProtection },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: i < 1 ? '16px' : '0' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '2px' }}>{item.label}</p>
              <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', lineHeight: '1.4' }}>{item.desc}</p>
            </div>
            <button onClick={() => item.onChange(!item.value)}
              style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: item.value ? 'var(--theme-primary)' : 'var(--theme-border)', position: 'relative', flexShrink: 0, transition: 'background 0.15s' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: item.value ? '23px' : '3px', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ ...card, background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)' }}>
        <p style={{ fontSize: '12px', color: 'var(--theme-primary)', lineHeight: '1.6' }}>
          🎁 <strong>Always on:</strong> Gift card delivery and free trial expiry reminders are sent by email regardless of push settings.
        </p>
      </div>

      <button onClick={saveNotifications} disabled={saving}
        style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px', opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving...' : 'Save preferences'}
      </button>
    </div>
  )
}

// ─── Account Section ──────────────────────────────────────────────────────────
function AccountSection({ profile, userId, card, saving, setSaving, showMessage, onSignOut, effectiveTier, tierConfig }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [showPauseConfirm, setShowPauseConfirm] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [billing, setBilling] = useState('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const isFree = effectiveTier === 'free_trial' || effectiveTier === 'free_expired'

  // Handle ?checkout=success in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      showMessage('🎉 Subscription activated! Your tier has been updated.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function startCheckout(tier, billingCycle) {
    setCheckoutLoading(true)
    try {
      trackEvent(supabase, userId, 'checkout_started', {
        tier,
        billing: billingCycle,
        from_tier: effectiveTier,
      })
      posthog.capture('checkout_started', { tier, billing: billingCycle, from_tier: effectiveTier })
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          billing: billingCycle,
          userId,
          userEmail: profile?.email,
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        showMessage('Could not start checkout. Please try again.', 'error')
      }
    } catch (e) {
      showMessage('Could not start checkout. Please try again.', 'error')
    }
    setCheckoutLoading(false)
  }

  async function pauseAccount() {
    setSaving(true)
    const { error } = await supabase.rpc('request_pause', { p_user_id: userId })
    if (error) showMessage('Could not pause account. Please contact support.', 'error')
    else {
      showMessage('Account pause scheduled for the 1st of next month.')
      posthog.capture('account_paused')
    }
    setShowPauseConfirm(false)
    setSaving(false)
  }

  async function deleteAccount() {
    if (deleteInput !== 'DELETE') return
    setSaving(true)
    posthog.capture('account_deleted')
    posthog.reset()
    await supabase.rpc('delete_user', { user_id: userId })
    await supabase.auth.signOut()
    setSaving(false)
  }

  const UPGRADE_TIERS = [
    {
      key: 'basic', label: 'Basic',
      monthly: '$0.99', annual: '$9.99',
      cap: '$5.00', maxCap: '$5.00',
      minDays: 10, customSlots: 1,
      color: 'var(--theme-primary)',
    },
    {
      key: 'plus', label: 'Plus',
      monthly: '$4.99', annual: '$49.99',
      cap: '$10.00', maxCap: '$17.50',
      minDays: 7, customSlots: 2,
      badge: 'Popular',
      color: 'var(--theme-primary)',
    },
    {
      key: 'premium', label: 'Premium',
      monthly: '$14.99', annual: '$149.99',
      cap: '$22.50', maxCap: '$45.00',
      minDays: 5, customSlots: 2,
      badge: 'Best value',
      color: '#C9973A',
    },
  ]

  return (
    <div>
      {/* Checkout success is handled in useEffect above */}

      {/* Current plan */}
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Current plan</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--theme-text)' }}>{tierConfig?.label || 'Free'}</p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>
              {isFree ? 'Free plan' : `$${tierConfig?.price}/month${profile?.billing_cycle === 'annual' ? ' (annual)' : ''}`}
            </p>
            {profile?.subscription_status === 'past_due' && (
              <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', fontWeight: '600' }}>⚠️ Payment past due — update payment method</p>
            )}
          </div>
          <span style={{ background: 'var(--theme-primary)', color: 'white', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
            {tierConfig?.label || 'Free'}
          </span>
        </div>

        {/* Upgrade / manage */}
        {isFree ? (
          <button onClick={() => { setShowUpgrade(true); posthog.capture('upgrade_modal_opened', { from_tier: effectiveTier }) }}
            style={{ width: '100%', background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '11px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            Upgrade to a paid plan →
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setShowUpgrade(true); posthog.capture('upgrade_modal_opened', { from_tier: effectiveTier }) }}
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

      {/* Upgrade modal */}
      {showUpgrade && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) setShowUpgrade(false) }}>
          <div style={{ background: 'var(--theme-bg)', borderRadius: '20px 20px 0 0', padding: '24px', width: '100%', maxWidth: '448px', maxHeight: '90vh', overflowY: 'auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)' }}>Choose a plan</h3>
              <button onClick={() => setShowUpgrade(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--theme-text-muted)' }}>✕</button>
            </div>

            {/* Billing toggle */}
            <div style={{ display: 'flex', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '10px', padding: '3px', marginBottom: '16px' }}>
              {['monthly', 'annual'].map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: billing === b ? 'var(--theme-primary)' : 'transparent', color: billing === b ? 'white' : 'var(--theme-text-muted)', fontWeight: billing === b ? '700' : '400', fontSize: '13px', transition: 'all 0.15s' }}>
                  {b === 'monthly' ? 'Monthly' : 'Annual'}
                  {b === 'annual' && <span style={{ marginLeft: '6px', fontSize: '10px', background: billing === 'annual' ? 'rgba(255,255,255,0.2)' : 'var(--theme-primary-light)', color: billing === 'annual' ? 'white' : 'var(--theme-primary)', padding: '1px 6px', borderRadius: '8px', fontWeight: '700' }}>Save ~17%</span>}
                </button>
              ))}
            </div>

            {/* Tier cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {UPGRADE_TIERS.map(t => {
                const isCurrent = effectiveTier === t.key
                const isSelected = selectedTier === t.key
                const price = billing === 'annual' ? t.annual : t.monthly
                const priceNote = billing === 'annual' ? '/year' : '/month'

                return (
                  <button key={t.key} onClick={() => !isCurrent && setSelectedTier(t.key)}
                    style={{
                      background: isCurrent ? 'var(--theme-bg)' : isSelected ? 'var(--theme-primary-light)' : 'var(--theme-card)',
                      border: `2px solid ${isCurrent ? 'var(--theme-border)' : isSelected ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                      borderRadius: '14px', padding: '14px 16px', cursor: isCurrent ? 'default' : 'pointer', textAlign: 'left',
                      opacity: isCurrent ? 0.6 : 1,
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <p style={{ fontSize: '16px', fontWeight: '800', color: 'var(--theme-text)' }}>{t.label}</p>
                          {t.badge && <span style={{ fontSize: '10px', fontWeight: '700', background: 'var(--theme-primary-light)', color: 'var(--theme-primary)', padding: '1px 7px', borderRadius: '8px' }}>{t.badge}</span>}
                          {isCurrent && <span style={{ fontSize: '10px', fontWeight: '700', background: 'var(--theme-border)', color: 'var(--theme-text-muted)', padding: '1px 7px', borderRadius: '8px' }}>Current</span>}
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>{t.customSlots} custom slot{t.customSlots > 1 ? 's' : ''} · min {t.minDays} days/mo</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--theme-text)', lineHeight: 1 }}>{price}</p>
                        <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>{priceNote}</p>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-primary)', marginTop: '2px' }}>Up to {t.maxCap}/mo</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Beta notice */}
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', color: '#92400e', lineHeight: '1.5' }}>
                🧪 You are subscribing to a live paid plan. You will be charged real money. Rewards are not yet paid out during beta — gift card delivery activates at full launch.
              </p>
            </div>

            <button
              onClick={() => selectedTier && startCheckout(selectedTier, billing)}
              disabled={!selectedTier || checkoutLoading}
              style={{ width: '100%', background: selectedTier ? 'var(--theme-primary)' : 'var(--theme-border)', color: selectedTier ? 'white' : 'var(--theme-text-muted)', fontWeight: '700', padding: '14px', borderRadius: '10px', border: 'none', cursor: selectedTier ? 'pointer' : 'not-allowed', fontSize: '15px', opacity: checkoutLoading ? 0.7 : 1 }}>
              {checkoutLoading ? 'Redirecting to checkout...' : selectedTier ? `Subscribe to ${UPGRADE_TIERS.find(t => t.key === selectedTier)?.label} →` : 'Select a plan'}
            </button>
          </div>
        </div>
      )}

      {/* Account info */}
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Account info</p>
        {[
          { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
          { label: 'Days logged', value: `${profile?.total_days_logged || 0} days` },
          { label: 'Overall successful days', value: `${profile?.overall_successful_days || 0} days` },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--theme-border)' : 'none' }}>
            <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div style={card}>
        <button onClick={onSignOut}
          style={{ width: '100%', background: 'none', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontWeight: '600', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>
          Sign out
        </button>
      </div>

      {/* Pause account */}
      {!isFree && (
        <div style={card}>
          <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Pause account</p>
          <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
            Pause your subscription for 1 month — once per year. No billing. No rewards. Streak and data are preserved.
          </p>
          {!showPauseConfirm ? (
            <button onClick={() => setShowPauseConfirm(true)}
              style={{ width: '100%', background: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              Pause for 1 month
            </button>
          ) : (
            <div style={{ background: '#fffbeb', borderRadius: '10px', padding: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '10px' }}>
                Pause scheduled for the 1st of next month. Confirm?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowPauseConfirm(false)}
                  style={{ flex: 1, background: 'none', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  Cancel
                </button>
                <button onClick={pauseAccount} disabled={saving}
                  style={{ flex: 1, background: '#C9973A', color: 'white', fontWeight: '700', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', border: 'none' }}>
                  {saving ? '...' : 'Confirm pause'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete account */}
      <div style={{ ...card, border: '1px solid #fecaca' }}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Delete account</p>
        <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', lineHeight: '1.5', marginBottom: '12px' }}>
          Permanently delete your account and all data. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            style={{ width: '100%', background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            Delete my account
          </button>
        ) : (
          <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#dc2626', marginBottom: '6px' }}>Type DELETE to confirm</p>
            <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE"
              style={{ background: 'white', border: '1px solid #fecaca', color: 'var(--theme-text)', width: '100%', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', marginBottom: '10px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                style={{ flex: 1, background: 'none', border: '1px solid var(--theme-border)', color: 'var(--theme-text-secondary)', fontWeight: '600', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                Cancel
              </button>
              <button onClick={deleteAccount} disabled={deleteInput !== 'DELETE' || saving}
                style={{ flex: 1, background: deleteInput === 'DELETE' ? '#dc2626' : 'var(--theme-border)', color: deleteInput === 'DELETE' ? 'white' : 'var(--theme-text-muted)', fontWeight: '700', padding: '10px', borderRadius: '8px', cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed', fontSize: '13px', border: 'none' }}>
                {saving ? '...' : 'Delete forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
