import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { applyTheme, TIER_CONFIG, getEffectiveTier, LIBRARY_HABITS, trackEvent } from '../../config'

export default function SettingsTab({ session, profile, streak, onSignOut, onRefresh }) {
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
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  }

  const sections = [
    { key: 'profile',       label: 'Profile'    },
    { key: 'habits',        label: 'Habits'     },
    { key: 'rewards',       label: 'Rewards'    },
    { key: 'notifications', label: 'Notifications' },
    { key: 'account',       label: 'Account'    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>Settings</h1>
      </div>

      {/* Section nav — clean centered text, no icons */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', background: 'var(--theme-card)', borderRadius: '12px', padding: '3px', border: '1px solid var(--theme-border)' }}>
        {sections.map(s => (
          <button key={s.key} onClick={() => setActiveSection(s.key)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none',
              cursor: 'pointer', textAlign: 'center',
              background: activeSection === s.key ? 'var(--theme-primary)' : 'transparent',
              color: activeSection === s.key ? 'white' : 'var(--theme-text-muted)',
              fontSize: '11px', fontWeight: activeSection === s.key ? '700' : '400',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Toast */}
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

      {activeSection === 'profile' && (
        <ProfileSection profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} onRefresh={onRefresh} />
      )}
      {activeSection === 'habits' && (
        <HabitsSection profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} onRefresh={onRefresh} effectiveTier={effectiveTier} tierConfig={tierConfig} />
      )}
      {activeSection === 'rewards' && (
        <RewardsSection profile={profile} card={card} effectiveTier={effectiveTier} tierConfig={tierConfig} />
      )}
      {activeSection === 'notifications' && (
        <NotificationsSection profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} />
      )}
      {activeSection === 'account' && (
        <AccountSection profile={profile} userId={userId} card={card} saving={saving} setSaving={setSaving} showMessage={showMessage} onSignOut={onSignOut} effectiveTier={effectiveTier} tierConfig={tierConfig} streak={streak} />
      )}
    </div>
  )
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function ProfileSection({ profile, userId, card, saving, setSaving, showMessage, onRefresh }) {
  const [theme, setTheme] = useState(profile?.color_theme || 'sage')

  async function saveProfile() {
    setSaving(true)
    await supabase.from('profiles').update({ color_theme: theme }).eq('id', userId)
    applyTheme(theme)
    showMessage('Theme updated.')
    onRefresh()
    setSaving(false)
  }

  return (
    <div>
      {/* Personal info */}
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Personal info</p>
        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
          🔒 To update personal details, email support@niyamalife.com
        </p>
        {[
          { label: 'Full name',     value: profile?.full_name || '—' },
          { label: 'Email',         value: profile?.email || '—' },
          { label: 'Phone',         value: profile?.phone || 'Not provided' },
          { label: 'Date of birth', value: profile?.date_of_birth ? new Date(profile.date_of_birth + 'T12:00:00').toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : '—' },
          { label: 'Member since',  value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month:'long', year:'numeric' }) : '—' },
          { label: 'Days logged',   value: `${profile?.total_days_logged || 0} days` },
          { label: 'Successful days', value: `${profile?.overall_successful_days || 0} days` },
        ].map((item, i, arr) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i < arr.length-1 ? '1px solid var(--theme-border)' : 'none' }}>
            <span style={{ fontSize:'13px', color:'var(--theme-text-secondary)' }}>{item.label}</span>
            <span style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text)', textAlign:'right', maxWidth:'60%', wordBreak:'break-all' }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Theme */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>App theme</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
          {[
            { key:'sage',   label:'Sage Green',   bg:'#F4F7F5', primary:'#5A8A78' },
            { key:'salmon', label:'Salmon Pink',  bg:'#F7F4F4', primary:'#D4735F' },
          ].map(t => (
            <button key={t.key} onClick={() => setTheme(t.key)}
              style={{ padding:'14px', borderRadius:'12px', cursor:'pointer', textAlign:'center', background:t.bg, border:`2px solid ${theme===t.key?t.primary:'var(--theme-border)'}` }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', background:t.primary, margin:'0 auto 8px' }} />
              <p style={{ fontSize:'12px', fontWeight:'600', color:theme===t.key?t.primary:'var(--theme-text-secondary)' }}>{t.label}</p>
              {theme===t.key && <p style={{ fontSize:'10px', color:t.primary, marginTop:'2px' }}>✓ Active</p>}
            </button>
          ))}
        </div>
        <button onClick={saveProfile} disabled={saving}
          style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'12px', borderRadius:'10px', border:'none', cursor:saving?'not-allowed':'pointer', fontSize:'14px', opacity:saving?0.7:1 }}>
          {saving ? 'Saving...' : 'Save theme'}
        </button>
      </div>
    </div>
  )
}

// ─── Habits ───────────────────────────────────────────────────────────────────
function HabitsSection({ profile, userId, card, saving, setSaving, showMessage, onRefresh, effectiveTier, tierConfig }) {
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
    const h = Math.floor(mins/60), m = mins%60
    const ampm = h<12?'AM':'PM', hour = h>12?h-12:h===0?12:h
    return `${hour}:${m.toString().padStart(2,'0')} ${ampm}`
  }

  function toggleLibrary(key) {
    setSelectedLibrary(prev => {
      if (prev.includes(key)) return prev.length<=4?prev:prev.filter(k=>k!==key)
      if (prev.length>=4) { const next=[...prev]; next[3]=key; return next }
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
      const daysSince = (Date.now() - new Date(lockCheck.habits_last_changed)) / (1000*60*60*24)
      if (daysSince < 30) {
        const daysLeft = Math.ceil(30 - daysSince)
        showMessage(`Habits locked for ${daysLeft} more day${daysLeft===1?'':'s'}.`, 'error')
        return
      }
    }
    setSaving(true)
    try {
      await supabase.from('user_habits').delete().eq('user_id', userId)
      const rows = []
      rows.push({ user_id:userId, habit_type:'core', habit_key:'wake',     habit_label:'Wake before chosen time', is_active:true, slot_index:0 })
      rows.push({ user_id:userId, habit_type:'core', habit_key:'no_phone', habit_label:'No phone after 10:30pm',  is_active:true, slot_index:1 })
      rows.push({ user_id:userId, habit_type:'core', habit_key:'steps',    habit_label:movement==='activity'?'activity':'steps', is_active:true, slot_index:2 })
      selectedLibrary.slice(0,4).forEach((key,i) => {
        const lib = LIBRARY_HABITS.find(h=>h.key===key)
        rows.push({ user_id:userId, habit_type:'library', habit_key:key, habit_label:lib?.label||key, habit_icon:lib?.icon, is_active:true, slot_index:i })
      })
      if (customSlots>=1 && custom1.trim()) rows.push({ user_id:userId, habit_type:'custom', habit_key:'custom_1', habit_label:custom1.trim(), is_active:true, slot_index:0 })
      if (customSlots>=2 && custom2.trim()) rows.push({ user_id:userId, habit_type:'custom', habit_key:'custom_2', habit_label:custom2.trim(), is_active:true, slot_index:1 })
      await supabase.from('user_habits').insert(rows)
      await supabase.from('profiles').update({ wake_time_minutes:wakeMinutes, habits_last_changed:new Date().toISOString() }).eq('id', userId)
      showMessage('Habits updated.')
      onRefresh()
    } catch (e) { showMessage('Failed to save.', 'error') }
    setSaving(false)
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', paddingTop:'40px' }}><div style={{ width:'24px', height:'24px', border:'2px solid var(--theme-primary)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /></div>

  // Lock status
  const habitsLocked = (() => {
    if (!profile?.habits_last_changed) return false
    const daysSince = (Date.now() - new Date(profile.habits_last_changed)) / (1000*60*60*24)
    return daysSince < 30
  })()
  const daysLeft = habitsLocked ? Math.ceil(30 - (Date.now() - new Date(profile.habits_last_changed)) / (1000*60*60*24)) : 0

  return (
    <div>
      {/* Wake time */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Wake goal</p>
        <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginBottom:'12px', lineHeight:'1.5' }}>
          Wake time can be updated anytime. Habit changes are locked for 30 days.
        </p>
        <div style={{ textAlign:'center', marginBottom:'14px' }}>
          <div style={{ background:'var(--theme-primary)', borderRadius:'14px', padding:'12px 20px', display:'inline-block' }}>
            <p style={{ fontSize:'32px', fontWeight:'800', color:'white', lineHeight:1 }}>{minutesToLabel(wakeMinutes)}</p>
          </div>
        </div>
        <input type="range" min={270} max={450} step={15} value={wakeMinutes}
          onChange={e => { setWakeMinutes(parseInt(e.target.value)); setWakeChanged(true) }}
          style={{ width:'100%', accentColor:'var(--theme-primary)', cursor:'pointer' }} />
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'4px', marginBottom:'12px' }}>
          <span style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>4:30 AM</span>
          <span style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>7:30 AM</span>
        </div>
        {wakeChanged && (
          <button onClick={saveWakeTime} disabled={saving}
            style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'11px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'13px', opacity:saving?0.7:1 }}>
            {saving?'Saving...':'Save wake time'}
          </button>
        )}
      </div>

      {/* Habit lock notice */}
      <div style={{ background: habitsLocked?'#fffbeb':'var(--theme-primary-light)', border:`1px solid ${habitsLocked?'#fcd34d':'var(--theme-primary)'}`, borderRadius:'10px', padding:'12px 14px', marginBottom:'16px' }}>
        <p style={{ fontSize:'12px', color:habitsLocked?'#92400e':'var(--theme-primary)', lineHeight:'1.5' }}>
          {habitsLocked
            ? `🔒 Habits locked for ${daysLeft} more day${daysLeft===1?'':'s'}. You can change your habits once every 30 days.`
            : '✅ Your habits are unlocked. Make changes and save below.'
          }
        </p>
      </div>

      {/* Movement */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Movement habit</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          {[
            { key:'steps',    label:'Steps',             icon:'👟', desc:'5k/7.5k/10k tiers' },
            { key:'activity', label:'Physical activity', icon:'🏃', desc:'30 min active HR'   },
          ].map(opt => (
            <button key={opt.key} onClick={() => !habitsLocked && setMovement(opt.key)}
              style={{ padding:'12px', borderRadius:'12px', cursor:habitsLocked?'not-allowed':'pointer', textAlign:'center', background:movement===opt.key?'var(--theme-primary)':'var(--theme-card)', border:`2px solid ${movement===opt.key?'var(--theme-primary)':'var(--theme-border)'}`, opacity:habitsLocked?0.6:1 }}>
              <p style={{ fontSize:'20px', marginBottom:'4px' }}>{opt.icon}</p>
              <p style={{ fontSize:'12px', fontWeight:'700', color:movement===opt.key?'white':'var(--theme-text)' }}>{opt.label}</p>
              <p style={{ fontSize:'10px', color:movement===opt.key?'rgba(255,255,255,0.7)':'var(--theme-text-muted)', marginTop:'2px' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Library habits */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Your 4 habits</p>
        <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginBottom:'12px' }}>Select exactly 4 from the library below.</p>
        <div style={{ display:'flex', gap:'6px', marginBottom:'12px', alignItems:'center' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%', background:i<selectedLibrary.length?'var(--theme-primary)':'var(--theme-border)' }} />
          ))}
          <span style={{ fontSize:'11px', color:'var(--theme-primary)', fontWeight:'700', marginLeft:'4px' }}>{selectedLibrary.length}/4</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {LIBRARY_HABITS.map(habit => {
            const isSelected = selectedLibrary.includes(habit.key)
            return (
              <button key={habit.key} onClick={() => !habitsLocked && toggleLibrary(habit.key)}
                style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', borderRadius:'10px', cursor:habitsLocked?'not-allowed':'pointer', textAlign:'left', background:isSelected?'var(--theme-primary)':'var(--theme-card)', border:`1px solid ${isSelected?'var(--theme-primary)':'var(--theme-border)'}`, opacity:habitsLocked?0.7:1 }}>
                <span style={{ fontSize:'16px', flexShrink:0 }}>{habit.icon}</span>
                <span style={{ fontSize:'13px', color:isSelected?'white':'var(--theme-text-secondary)', flex:1 }}>{habit.label}</span>
                {isSelected && <span style={{ fontSize:'12px', color:'white' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom habits */}
      {customSlots > 0 && (
        <div style={card}>
          <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>
            Custom habits ({customSlots} slot{customSlots>1?'s':''})
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <div>
              <label style={{ fontSize:'12px', color:'var(--theme-text-secondary)', display:'block', marginBottom:'4px' }}>Custom habit 1</label>
              <input type="text" value={custom1} onChange={e => !habitsLocked && setCustom1(e.target.value)} maxLength={60} placeholder="e.g. Cold shower, No sugar..." disabled={habitsLocked}
                style={{ background:'var(--theme-bg)', border:'1px solid var(--theme-border)', color:'var(--theme-text)', width:'100%', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', outline:'none', boxSizing:'border-box', opacity:habitsLocked?0.6:1 }} />
            </div>
            {customSlots>=2 && (
              <div>
                <label style={{ fontSize:'12px', color:'var(--theme-text-secondary)', display:'block', marginBottom:'4px' }}>Custom habit 2</label>
                <input type="text" value={custom2} onChange={e => !habitsLocked && setCustom2(e.target.value)} maxLength={60} placeholder="e.g. Meal prep, Journaling..." disabled={habitsLocked}
                  style={{ background:'var(--theme-bg)', border:'1px solid var(--theme-border)', color:'var(--theme-text)', width:'100%', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', outline:'none', boxSizing:'border-box', opacity:habitsLocked?0.6:1 }} />
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={saveHabits} disabled={saving || selectedLibrary.length!==4 || habitsLocked}
        style={{ width:'100%', background:selectedLibrary.length===4&&!habitsLocked?'var(--theme-primary)':'var(--theme-border)', color:selectedLibrary.length===4&&!habitsLocked?'white':'var(--theme-text-muted)', fontWeight:'700', padding:'14px', borderRadius:'10px', border:'none', cursor:saving||selectedLibrary.length!==4||habitsLocked?'not-allowed':'pointer', fontSize:'15px', opacity:saving?0.7:1 }}>
        {habitsLocked ? `Locked for ${daysLeft} more day${daysLeft===1?'':'s'}` : saving ? 'Saving...' : selectedLibrary.length===4 ? 'Save habit changes' : 'Select exactly 4 habits'}
      </button>
    </div>
  )
}

// ─── Rewards info ─────────────────────────────────────────────────────────────
function RewardsSection({ profile, card, effectiveTier, tierConfig }) {
  const TIER_CONFIG_ALL = TIER_CONFIG
  const milestones = tierConfig?.milestones || {}
  const maxCap = tierConfig?.max_cap || tierConfig?.reward_cap || 0
  const minDays = tierConfig?.min_days || 0

  return (
    <div>
      {/* How rewards work */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>How rewards work</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {[
            { icon:'📊', title:'Earn points daily',       desc:'Complete your habits each day to earn up to 750 points. 1,000 points = $1.00 in rewards.' },
            { icon:'📅', title:'Hit your minimum days',   desc:`Reach ${minDays||10} successful days this month to qualify for your reward. A successful day = 5 of 9 habits completed (at least 2 core).` },
            { icon:'🎁', title:'Gift card on the 1st',    desc:'Your reward is automatically sent as a gift card to your email on the 1st of each month via Tremendous.' },
            { icon:'🔒', title:'No cash transfers',       desc:'All rewards are electronic gift cards only — Amazon, Starbucks, Nike, Apple, and more. No cash, no transfers.' },
            { icon:'📵', title:'Stay active',             desc:'5 or more consecutive inactive days makes you ineligible for that month\'s reward. Submit daily to stay eligible.' },
          ].map((item,i) => (
            <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
              <span style={{ fontSize:'20px', flexShrink:0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'2px' }}>{item.title}</p>
                <p style={{ fontSize:'12px', color:'var(--theme-text-secondary)', lineHeight:'1.5' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reward milestones */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'4px' }}>Reward milestones</p>
        <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginBottom:'16px' }}>Your current tier: <strong style={{ color:'var(--theme-primary)' }}>{tierConfig?.label||'Free'}</strong> · Max reward: <strong style={{ color:'var(--theme-primary)' }}>${maxCap.toFixed(2)}/month</strong></p>

        {/* Tier comparison */}
        <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'16px' }}>
          {[
            { key:'free_trial', label:'Free',    cap:2.50,  max:2.50,  min:10, desc:'First 3 months only' },
            { key:'basic',      label:'Basic',   cap:5.00,  max:5.00,  min:10, price:'$0.99/mo' },
            { key:'plus',       label:'Plus',    cap:10.00, max:17.50, min:7,  price:'$4.99/mo', bonuses:'+$2.50 at 20 days, +$5.00 successful month' },
            { key:'premium',    label:'Premium', cap:22.50, max:45.00, min:5,  price:'$14.99/mo', bonuses:'+$2.50 at 10 days, +$5.00 at 20 days, +$7.50 successful month, +$7.50 perfect month' },
          ].map((t,i) => {
            const isCurrent = effectiveTier === t.key || (effectiveTier==='free_expired' && t.key==='free_trial')
            return (
              <div key={i} style={{ background:isCurrent?'var(--theme-primary-light)':'var(--theme-bg)', border:`1px solid ${isCurrent?'var(--theme-primary)':'var(--theme-border)'}`, borderRadius:'12px', padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:t.bonuses?'6px':'0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <p style={{ fontSize:'14px', fontWeight:'700', color:'var(--theme-text)' }}>{t.label}</p>
                    {isCurrent && <span style={{ fontSize:'10px', background:'var(--theme-primary)', color:'white', padding:'1px 7px', borderRadius:'8px', fontWeight:'700' }}>Your plan</span>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'13px', fontWeight:'700', color:isCurrent?'var(--theme-primary)':'var(--theme-text)' }}>Up to ${t.max.toFixed(2)}/mo</p>
                    <p style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>{t.price||t.desc} · {t.min} days min</p>
                  </div>
                </div>
                {t.bonuses && <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', lineHeight:'1.4' }}>🎯 {t.bonuses}</p>}
              </div>
            )
          })}
        </div>
      </div>

      {/* How referrals work */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>How referrals work</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {[
            { icon:'📤', title:'Share your code',               desc:'Send your unique referral code to a friend.' },
            { icon:'✅', title:'They sign up',                  desc:'Your friend creates an account and selects a paid plan.' },
            { icon:'🎯', title:'They complete a successful day', desc:'Once they hit their first successful day, the referral is confirmed.' },
            { icon:'🎁', title:'Both of you earn',              desc:'Your monthly reward cap increases by $2.50. So does theirs. Max 20 referrals/year.' },
          ].map((item,i) => (
            <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
              <span style={{ fontSize:'20px', flexShrink:0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'2px' }}>{item.title}</p>
                <p style={{ fontSize:'12px', color:'var(--theme-text-secondary)', lineHeight:'1.4' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terms & Privacy */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' }}>Legal</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {[
            { label:'Terms of Service', url:'https://www.niyamalife.com/terms' },
            { label:'Privacy Policy',   url:'https://www.niyamalife.com/privacy' },
            { label:'Cookie Policy',    url:'https://www.niyamalife.com/privacy#cookies' },
          ].map((item,i) => (
            <button key={i} onClick={() => window.open(item.url, '_blank')}
              style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', background:'none', border:'none', borderBottom:i<2?'1px solid var(--theme-border)':'none', cursor:'pointer', width:'100%' }}>
              <span style={{ fontSize:'13px', color:'var(--theme-text)' }}>{item.label}</span>
              <span style={{ fontSize:'13px', color:'var(--theme-text-muted)' }}>↗</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────
function NotificationsSection({ profile, userId, card, saving, setSaving, showMessage }) {
  const [pushEnabled, setPushEnabled]           = useState(false)
  const [middayNudge, setMiddayNudge]           = useState(profile?.email_reminders ?? true)
  const [streakProtection, setStreakProtection] = useState(true)
  const [requesting, setRequesting]             = useState(false)

  useEffect(() => {
    if ('Notification' in window) setPushEnabled(Notification.permission === 'granted')
  }, [])

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
    <div>
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>Push notifications</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <div>
            <p style={{ fontSize:'14px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'2px' }}>Enable push notifications</p>
            <p style={{ fontSize:'12px', color:'var(--theme-text-muted)' }}>Wake alerts, evening reminders, gift card delivery</p>
          </div>
          <button onClick={pushEnabled?undefined:requestPush} disabled={requesting}
            style={{ background:pushEnabled?'var(--theme-primary)':'var(--theme-border)', border:'none', borderRadius:'20px', padding:'6px 14px', cursor:pushEnabled?'default':'pointer', color:pushEnabled?'white':'var(--theme-text-muted)', fontSize:'12px', fontWeight:'600', flexShrink:0 }}>
            {requesting?'...':pushEnabled?'✓ On':'Enable'}
          </button>
        </div>
        {!('Notification' in window) && (
          <div style={{ background:'#fffbeb', borderRadius:'8px', padding:'8px 12px' }}>
            <p style={{ fontSize:'11px', color:'#92400e' }}>Push notifications require the native app — available on iOS and Android.</p>
          </div>
        )}
      </div>

      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'16px' }}>Preferences</p>
        {[
          { label:'Midday nudge',      desc:'Personalized reminder at noon based on incomplete habits', value:middayNudge,      onChange:setMiddayNudge },
          { label:'Streak protection', desc:'Reminder at 10pm if you haven\'t submitted today',          value:streakProtection, onChange:setStreakProtection },
        ].map((item,i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'12px', marginBottom:i<1?'16px':'0' }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'14px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'2px' }}>{item.label}</p>
              <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', lineHeight:'1.4' }}>{item.desc}</p>
            </div>
            <button onClick={() => item.onChange(!item.value)}
              style={{ width:'44px', height:'24px', borderRadius:'12px', border:'none', cursor:'pointer', background:item.value?'var(--theme-primary)':'var(--theme-border)', position:'relative', flexShrink:0, transition:'background 0.15s' }}>
              <div style={{ width:'18px', height:'18px', borderRadius:'50%', background:'white', position:'absolute', top:'3px', left:item.value?'23px':'3px', transition:'left 0.15s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ ...card, background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)' }}>
        <p style={{ fontSize:'12px', color:'var(--theme-primary)', lineHeight:'1.6' }}>
          🎁 <strong>Always on:</strong> Gift card delivery and trial expiry reminders are always sent by email.
        </p>
      </div>

      <button onClick={saveNotifications} disabled={saving}
        style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'14px', borderRadius:'10px', border:'none', cursor:saving?'not-allowed':'pointer', fontSize:'15px', opacity:saving?0.7:1 }}>
        {saving?'Saving...':'Save preferences'}
      </button>
    </div>
  )
}

// ─── Account ──────────────────────────────────────────────────────────────────
function AccountSection({ profile, userId, card, saving, setSaving, showMessage, onSignOut, effectiveTier, tierConfig, streak }) {
  const [deleteInput, setDeleteInput]         = useState('')
  const [showPauseConfirm, setShowPauseConfirm] = useState(false)
  const [showUpgrade, setShowUpgrade]         = useState(false)
  const [selectedTier, setSelectedTier]       = useState(null)
  const [billing, setBilling]                 = useState('monthly')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [deleteStep, setDeleteStep]           = useState(0)

  const isFree = effectiveTier==='free_trial'||effectiveTier==='free_expired'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout')==='success') {
      showMessage('🎉 Subscription activated!')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function startCheckout(tier, billingCycle) {
    setCheckoutLoading(true)
    try {
      trackEvent(supabase, userId, 'checkout_started', { tier, billing:billingCycle, from_tier:effectiveTier })
      const res = await fetch('/api/create-checkout-session', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tier, billing:billingCycle, userId, userEmail:profile?.email })
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else showMessage('Could not start checkout. Please try again.', 'error')
    } catch (e) { showMessage('Could not start checkout. Please try again.', 'error') }
    setCheckoutLoading(false)
  }

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

  const UPGRADE_TIERS = [
    { key:'basic',   label:'Basic',   monthly:'$0.99', annual:'$9.99',   cap:'$5.00',  maxCap:'$5.00',  minDays:10, customSlots:1 },
    { key:'plus',    label:'Plus',    monthly:'$4.99', annual:'$49.99',  cap:'$10.00', maxCap:'$17.50', minDays:7,  customSlots:2, badge:'Popular' },
    { key:'premium', label:'Premium', monthly:'$14.99',annual:'$149.99', cap:'$22.50', maxCap:'$45.00', minDays:5,  customSlots:2, badge:'Best value' },
  ]

  return (
    <div>
      {/* Current plan */}
      <div style={card}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'12px' }}>Current plan</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <div>
            <p style={{ fontSize:'20px', fontWeight:'800', color:'var(--theme-text)' }}>{tierConfig?.label||'Free'}</p>
            <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', marginTop:'2px' }}>
              {isFree?'Free plan':`$${tierConfig?.price}/month${profile?.billing_cycle==='annual'?' (annual)':''}`}
            </p>
            {profile?.subscription_status==='past_due' && (
              <p style={{ fontSize:'11px', color:'#dc2626', marginTop:'2px', fontWeight:'600' }}>⚠️ Payment past due</p>
            )}
          </div>
          <span style={{ background:'var(--theme-primary)', color:'white', fontSize:'11px', fontWeight:'700', padding:'4px 10px', borderRadius:'20px' }}>
            {tierConfig?.label||'Free'}
          </span>
        </div>
        {isFree ? (
          <button onClick={() => setShowUpgrade(true)}
            style={{ width:'100%', background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'11px', borderRadius:'10px', border:'none', cursor:'pointer', fontSize:'14px' }}>
            Upgrade to a paid plan
          </button>
        ) : (
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={() => setShowUpgrade(true)}
              style={{ flex:1, background:'var(--theme-primary-light)', border:'1px solid var(--theme-primary)', color:'var(--theme-primary)', fontWeight:'700', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>
              Change plan
            </button>
            <button onClick={() => window.open('https://billing.stripe.com/p/login/test', '_blank')}
              style={{ flex:1, background:'var(--theme-bg)', border:'1px solid var(--theme-border)', color:'var(--theme-text-secondary)', fontWeight:'600', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>
              Manage billing ↗
            </button>
          </div>
        )}
      </div>

      {/* Upgrade modal */}
      {showUpgrade && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center' }}
          onClick={e => { if (e.target===e.currentTarget) setShowUpgrade(false) }}>
          <div style={{ background:'var(--theme-bg)', borderRadius:'20px 20px 0 0', padding:'24px', width:'100%', maxWidth:'448px', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <h3 style={{ fontSize:'18px', fontWeight:'800', color:'var(--theme-text)' }}>Choose a plan</h3>
              <button onClick={() => setShowUpgrade(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'20px', color:'var(--theme-text-muted)' }}>✕</button>
            </div>
            <div style={{ display:'flex', background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'10px', padding:'3px', marginBottom:'16px' }}>
              {['monthly','annual'].map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  style={{ flex:1, padding:'8px', borderRadius:'8px', border:'none', cursor:'pointer', background:billing===b?'var(--theme-primary)':'transparent', color:billing===b?'white':'var(--theme-text-muted)', fontWeight:billing===b?'700':'400', fontSize:'13px', transition:'all 0.15s' }}>
                  {b==='monthly'?'Monthly':'Annual'}
                  {b==='annual'&&<span style={{ marginLeft:'6px', fontSize:'10px', background:billing==='annual'?'rgba(255,255,255,0.2)':'var(--theme-primary-light)', color:billing==='annual'?'white':'var(--theme-primary)', padding:'1px 6px', borderRadius:'8px', fontWeight:'700' }}>Save ~17%</span>}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
              {UPGRADE_TIERS.map(t => {
                const isCurrent = effectiveTier===t.key
                const isSelected = selectedTier===t.key
                const price = billing==='annual'?t.annual:t.monthly
                return (
                  <button key={t.key} onClick={() => !isCurrent&&setSelectedTier(t.key)}
                    style={{ background:isCurrent?'var(--theme-bg)':isSelected?'var(--theme-primary-light)':'var(--theme-card)', border:`2px solid ${isCurrent?'var(--theme-border)':isSelected?'var(--theme-primary)':'var(--theme-border)'}`, borderRadius:'14px', padding:'14px 16px', cursor:isCurrent?'default':'pointer', textAlign:'left', opacity:isCurrent?0.6:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                          <p style={{ fontSize:'16px', fontWeight:'800', color:'var(--theme-text)' }}>{t.label}</p>
                          {t.badge&&<span style={{ fontSize:'10px', fontWeight:'700', background:'var(--theme-primary-light)', color:'var(--theme-primary)', padding:'1px 7px', borderRadius:'8px' }}>{t.badge}</span>}
                          {isCurrent&&<span style={{ fontSize:'10px', fontWeight:'700', background:'var(--theme-border)', color:'var(--theme-text-muted)', padding:'1px 7px', borderRadius:'8px' }}>Current</span>}
                        </div>
                        <p style={{ fontSize:'11px', color:'var(--theme-text-muted)' }}>{t.customSlots} custom slot{t.customSlots>1?'s':''} · min {t.minDays} days/mo</p>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <p style={{ fontSize:'18px', fontWeight:'800', color:'var(--theme-text)', lineHeight:1 }}>{price}</p>
                        <p style={{ fontSize:'11px', fontWeight:'700', color:'var(--theme-primary)', marginTop:'2px' }}>Up to {t.maxCap}/mo</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => selectedTier&&startCheckout(selectedTier,billing)} disabled={!selectedTier||checkoutLoading}
              style={{ width:'100%', background:selectedTier?'var(--theme-primary)':'var(--theme-border)', color:selectedTier?'white':'var(--theme-text-muted)', fontWeight:'700', padding:'14px', borderRadius:'10px', border:'none', cursor:selectedTier?'pointer':'not-allowed', fontSize:'15px', opacity:checkoutLoading?0.7:1 }}>
              {checkoutLoading?'Redirecting...':selectedTier?`Subscribe to ${UPGRADE_TIERS.find(t=>t.key===selectedTier)?.label}`:'Select a plan'}
            </button>
          </div>
        </div>
      )}

      {/* Sign out */}
      <div style={card}>
        <button onClick={onSignOut}
          style={{ width:'100%', background:'none', border:'1px solid var(--theme-border)', color:'var(--theme-text-secondary)', fontWeight:'600', padding:'12px', borderRadius:'10px', cursor:'pointer', fontSize:'14px' }}>
          Sign out
        </button>
      </div>

      {/* Pause */}
      {!isFree && (
        <div style={card}>
          <p style={{ fontSize:'13px', fontWeight:'700', color:'var(--theme-text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Pause account</p>
          <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', lineHeight:'1.5', marginBottom:'12px' }}>
            Pause for 1 month — once per year. No billing. No rewards. Streak and data preserved.
          </p>
          {!showPauseConfirm ? (
            <button onClick={() => setShowPauseConfirm(true)}
              style={{ width:'100%', background:'#fffbeb', border:'1px solid #fcd34d', color:'#92400e', fontWeight:'600', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>
              Pause for 1 month
            </button>
          ) : (
            <div style={{ background:'#fffbeb', borderRadius:'10px', padding:'14px' }}>
              <p style={{ fontSize:'13px', fontWeight:'600', color:'#92400e', marginBottom:'10px' }}>Pause scheduled for 1st of next month. Confirm?</p>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setShowPauseConfirm(false)} style={{ flex:1, background:'none', border:'1px solid var(--theme-border)', color:'var(--theme-text-secondary)', fontWeight:'600', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>Cancel</button>
                <button onClick={pauseAccount} disabled={saving} style={{ flex:1, background:'#C9973A', color:'white', fontWeight:'700', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', border:'none' }}>
                  {saving?'...':'Confirm pause'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete */}
      <div style={{ ...card, border:'1px solid #fecaca' }}>
        <p style={{ fontSize:'13px', fontWeight:'700', color:'#dc2626', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' }}>Delete account</p>
        {deleteStep===0 && (
          <>
            <p style={{ fontSize:'12px', color:'var(--theme-text-muted)', lineHeight:'1.5', marginBottom:'12px' }}>
              Your account will be deactivated immediately and permanently deleted after 30 days.
            </p>
            <button onClick={() => setDeleteStep(1)} style={{ width:'100%', background:'#fef2f2', border:'1px solid #fecaca', color:'#dc2626', fontWeight:'600', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>
              I want to delete my account
            </button>
          </>
        )}
        {deleteStep===1 && (
          <div style={{ background:'#fef2f2', borderRadius:'10px', padding:'14px' }}>
            <p style={{ fontSize:'14px', fontWeight:'700', color:'#dc2626', marginBottom:'8px' }}>Before you go...</p>
            <p style={{ fontSize:'13px', color:'var(--theme-text-secondary)', lineHeight:'1.6', marginBottom:'12px' }}>
              You've logged <strong>{profile?.total_days_logged||0} days</strong> and built a <strong>{streak?.current_streak||0}-day streak</strong>. That's real progress — are you sure?
            </p>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setDeleteStep(0)} style={{ flex:1, background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', border:'none' }}>Keep my account</button>
              <button onClick={() => setDeleteStep(2)} style={{ flex:1, background:'none', border:'1px solid #fecaca', color:'#dc2626', fontWeight:'600', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>Still delete</button>
            </div>
          </div>
        )}
        {deleteStep===2 && (
          <div style={{ background:'#fef2f2', borderRadius:'10px', padding:'14px' }}>
            <p style={{ fontSize:'14px', fontWeight:'700', color:'#dc2626', marginBottom:'8px' }}>Did you know?</p>
            <p style={{ fontSize:'13px', color:'var(--theme-text-secondary)', lineHeight:'1.6', marginBottom:'12px' }}>
              You can <strong>pause your account</strong> for 1 month instead — no billing, streak preserved. Would you like to pause?
            </p>
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setDeleteStep(0)} style={{ flex:1, background:'var(--theme-primary)', color:'white', fontWeight:'700', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', border:'none' }}>Pause instead</button>
              <button onClick={() => setDeleteStep(3)} style={{ flex:1, background:'none', border:'1px solid #fecaca', color:'#dc2626', fontWeight:'600', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>No, delete</button>
            </div>
          </div>
        )}
        {deleteStep===3 && (
          <div style={{ background:'#fef2f2', borderRadius:'10px', padding:'14px' }}>
            <p style={{ fontSize:'13px', fontWeight:'600', color:'#dc2626', marginBottom:'6px' }}>Type DELETE to confirm</p>
            <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginBottom:'10px', lineHeight:'1.5' }}>
              Account deactivated immediately · Data deleted after 30 days · Restore within 30 days: support@niyamalife.com
            </p>
            <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE"
              style={{ background:'white', border:'1px solid #fecaca', color:'var(--theme-text)', width:'100%', borderRadius:'8px', padding:'10px 12px', fontSize:'14px', outline:'none', boxSizing:'border-box', marginBottom:'10px' }} />
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => { setDeleteStep(0); setDeleteInput('') }} style={{ flex:1, background:'none', border:'1px solid var(--theme-border)', color:'var(--theme-text-secondary)', fontWeight:'600', padding:'10px', borderRadius:'8px', cursor:'pointer', fontSize:'13px' }}>Cancel</button>
              <button onClick={deleteAccount} disabled={deleteInput!=='DELETE'||saving}
                style={{ flex:1, background:deleteInput==='DELETE'?'#dc2626':'var(--theme-border)', color:deleteInput==='DELETE'?'white':'var(--theme-text-muted)', fontWeight:'700', padding:'10px', borderRadius:'8px', cursor:deleteInput==='DELETE'?'pointer':'not-allowed', fontSize:'13px', border:'none' }}>
                {saving?'...':'Delete forever'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
