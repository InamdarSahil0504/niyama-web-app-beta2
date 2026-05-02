import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { CORE_HABITS, LIBRARY_HABITS, TIER_CONFIG, getEffectiveTier, getTodayString } from '../../config'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}
function formatMonth(year, month) {
  return new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

export default function AnalyticsTab({ session, profile, streak, userHabits }) {
  const [summaries, setSummaries] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const userId = session.user.id
  const today = getTodayString()

  // Load ALL data once — period filtering is client-side
  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: summaryData } = await supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    setSummaries(summaryData || [])

    const { data: logData } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
    setLogs(logData || [])
    setLoading(false)
  }

  // ── Period filtering ───────────────────────────────────────────────────────
  const now = new Date()
  const periodDays = period === '30' ? 30 : period === '90' ? 90 : null
  const periodFrom = periodDays
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - periodDays)
      .toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    : null

  const filteredSummaries = periodFrom
    ? summaries.filter(s => s.date >= periodFrom)
    : summaries

  const submittedSummaries = filteredSummaries.filter(s => s.submitted)

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalDays = submittedSummaries.length
  const successfulDays = submittedSummaries.filter(s => s.day_successful).length
  const perfectDays = submittedSummaries.filter(s => s.perfect_day).length
  const successRate = totalDays > 0 ? Math.round((successfulDays / totalDays) * 100) : 0
  const totalPoints = submittedSummaries.reduce((s, r) => s + (r.total_points || 0), 0)
  const avgPoints = totalDays > 0 ? Math.round(totalPoints / totalDays) : 0

  // ── Calendar data ──────────────────────────────────────────────────────────
  const summaryMap = {}
  summaries.forEach(s => { summaryMap[s.date] = s })

  const { year: calYear, month: calMonthIdx } = calMonth
  const daysInMonth = getDaysInMonth(calYear, calMonthIdx)
  const firstDayOfWeek = getFirstDayOfMonth(calYear, calMonthIdx)

  const calDays = []
  // Padding before first day
  for (let i = 0; i < firstDayOfWeek; i++) calDays.push(null)
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const s = summaryMap[dateStr]
    const isFuture = dateStr > today
    calDays.push({
      day: d, date: dateStr, isFuture,
      status: isFuture ? 'future' : !s ? 'inactive' : s.perfect_day ? 'perfect' : s.day_successful ? 'success' : 'miss',
      points: s?.total_points || 0,
    })
  }

  function calColor(status) {
    if (status === 'perfect') return '#C9973A'
    if (status === 'success') return 'var(--theme-primary)'
    if (status === 'miss') return 'var(--theme-secondary)'
    if (status === 'future') return 'transparent'
    return 'var(--theme-border)' // inactive
  }

  function prevMonth() {
    setCalMonth(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }
  function nextMonth() {
    const now = new Date()
    setCalMonth(prev => {
      if (prev.year === now.getFullYear() && prev.month === now.getMonth()) return prev
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }
  const isCurrentMonth = calYear === now.getFullYear() && calMonthIdx === now.getMonth()

  // ── Habit completion rates ─────────────────────────────────────────────────
  const libraryRows = Array.isArray(userHabits) ? userHabits.filter(h => h.habit_type === 'library') : []
  const customRows = Array.isArray(userHabits) ? userHabits.filter(h => h.habit_type === 'custom') : []

  const libraryHabits = libraryRows.length > 0
    ? libraryRows.map(r => LIBRARY_HABITS.find(h => h.key === r.habit_key) || { key: r.habit_key, label: r.habit_label, icon: '📌' })
    : ['sunlight', 'hydration', 'meditation', 'no_late_food'].map(k => LIBRARY_HABITS.find(h => h.key === k)).filter(Boolean)

  const customHabits = customRows.map((r, i) => ({
    key: r.habit_key || `custom_${i + 1}`, label: r.habit_label, icon: '⭐'
  }))

  const allHabits = [
    ...CORE_HABITS,
    ...libraryHabits,
    ...customHabits,
  ]

  const habitRates = allHabits.map(habit => {
    const habitLogs = logs.filter(l => l.habit_key === habit.key)
    const completed = habitLogs.filter(l => l.completed).length
    const total = habitLogs.length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0
    const type = CORE_HABITS.find(h => h.key === habit.key) ? 'core'
      : habit.key.startsWith('custom') ? 'custom' : 'library'
    return { ...habit, rate, completed, total, type }
  }).filter(h => h.total > 0).sort((a, b) => b.rate - a.rate)

  // ── Best day of week ───────────────────────────────────────────────────────
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayStats = dayNames.map((name, i) => {
    const daySummaries = submittedSummaries.filter(s => new Date(s.date + 'T12:00:00').getDay() === i)
    const success = daySummaries.filter(s => s.day_successful).length
    const total = daySummaries.length
    return { name, short: name.slice(0, 3), rate: total > 0 ? Math.round((success / total) * 100) : null, total }
  })
  const daysWithData = dayStats.filter(d => d.rate !== null)
  const bestDay = daysWithData.length > 0 ? daysWithData.reduce((a, b) => a.rate > b.rate ? a : b) : null
  const worstDay = daysWithData.length > 0 ? daysWithData.reduce((a, b) => a.rate < b.rate ? a : b) : null

  // ── Points sparkline (last 30 days) ───────────────────────────────────────
  const sparklineDays = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const str = d.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    const s = summaryMap[str]
    sparklineDays.push({ date: str, points: s?.total_points || 0, status: !s ? 'none' : s.perfect_day ? 'perfect' : s.day_successful ? 'success' : 'miss' })
  }
  const maxSparkPoints = Math.max(...sparklineDays.map(d => d.points), 1)
  const recentTrend = (() => {
    const first15 = sparklineDays.slice(0, 15).filter(d => d.points > 0)
    const last15 = sparklineDays.slice(15).filter(d => d.points > 0)
    if (first15.length === 0 || last15.length === 0) return null
    const avg1 = first15.reduce((s, d) => s + d.points, 0) / first15.length
    const avg2 = last15.reduce((s, d) => s + d.points, 0) / last15.length
    const diff = Math.round(((avg2 - avg1) / avg1) * 100)
    return diff
  })()

  // ── Milestone progress ─────────────────────────────────────────────────────
  const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const tierCfg = TIER_CONFIG[effectiveTier]
  const currentSuccessfulDays = profile?.successful_days || 0

  const milestones = []
  if (tierCfg?.milestones?.days_10_bonus) {
    milestones.push({ label: '10-day milestone', days: 10, bonus: `+$${tierCfg.milestones.days_10_bonus.toFixed(2)}` })
  }
  if (tierCfg?.milestones?.days_20_bonus) {
    milestones.push({ label: '20-day milestone', days: 20, bonus: `+$${tierCfg.milestones.days_20_bonus.toFixed(2)}` })
  }
  if (tierCfg?.milestones?.successful_month_bonus) {
    milestones.push({ label: 'Successful month', days: null, bonus: `+$${tierCfg.milestones.successful_month_bonus.toFixed(2)}`, special: true })
  }
  if (tierCfg?.milestones?.perfect_month_bonus) {
    milestones.push({ label: 'Perfect month', days: null, bonus: `+$${tierCfg.milestones.perfect_month_bonus.toFixed(2)}`, special: true, gold: true })
  }

  const card = {
    background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px' }}>
      <div style={{ width: '28px', height: '28px', border: '3px solid var(--theme-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  // Empty state — no data yet
  if (!loading && summaries.length === 0) return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>Your analytics</h1>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>Your journey is just beginning</p>
      </div>

      {/* Hero empty state */}
      <div style={{ background: 'var(--theme-primary)', borderRadius: '20px', padding: '32px 24px', marginBottom: '16px', color: 'white', textAlign: 'center' }}>
        <p style={{ fontSize: '48px', marginBottom: '16px' }}>📊</p>
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Your stats start today
        </h2>
        <p style={{ fontSize: '14px', opacity: '0.85', lineHeight: '1.6', marginBottom: '24px' }}>
          Complete and submit your first day of habits to unlock your personal analytics dashboard.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px' }}>
          {[
            { icon: '🔥', text: 'Streak tracking and history' },
            { icon: '📈', text: 'Points trends over time' },
            { icon: '✅', text: 'Habit completion rates' },
            { icon: '😊', text: 'Mood vs discipline correlation' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: i < 3 ? '12px' : '0' }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
              <p style={{ fontSize: '13px', opacity: '0.9', textAlign: 'left' }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Preview cards — grayed out */}
      <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', textAlign: 'center', marginBottom: '16px', fontStyle: 'italic' }}>
        Preview of what you'll see after your first submission
      </p>

      {/* KPI preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', opacity: 0.35, pointerEvents: 'none' }}>
        {[
          { label: 'Success rate', value: '—%' },
          { label: 'Perfect days', value: '—' },
          { label: 'Avg pts / day', value: '—' },
          { label: 'Best streak', value: '— days' },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '14px', padding: '14px' }}>
            <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '6px' }}>{kpi.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '800', color: 'var(--theme-text)' }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar preview */}
      <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px', opacity: 0.35, pointerEvents: 'none' }}>
        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '16px' }}>Habit calendar</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <p key={i} style={{ fontSize: '10px', color: 'var(--theme-text-muted)', textAlign: 'center', marginBottom: '6px' }}>{d}</p>
          ))}
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} style={{ aspectRatio: '1', borderRadius: '4px', background: 'var(--theme-border)' }} />
          ))}
        </div>
      </div>

      {/* Mood preview */}
      <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', opacity: 0.35, pointerEvents: 'none' }}>
        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '12px' }}>Mood tracker</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {['😩', '😕', '😐', '😊', '🔥'].map((e, i) => (
            <span key={i} style={{ fontSize: '24px' }}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  )
  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>Your analytics</h1>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>
          {summaries.length} day{summaries.length !== 1 ? 's' : ''} tracked total
        </p>
      </div>

      {summaries.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ fontSize: '40px', marginBottom: '16px' }}>📊</p>
          <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '8px' }}>No data yet</p>
          <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)', lineHeight: '1.6' }}>
            Submit your first day of habits to start seeing your analytics here.
          </p>
        </div>
      ) : (
        <>
          {/* ── Period selector ── */}
          <div style={{ display: 'flex', background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '12px', padding: '3px', marginBottom: '16px' }}>
            {[['30', 'Last 30 days'], ['90', 'Last 90 days'], ['all', 'All time']].map(([val, label]) => (
              <button key={val} onClick={() => setPeriod(val)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  background: period === val ? 'var(--theme-primary)' : 'transparent',
                  color: period === val ? 'white' : 'var(--theme-text-muted)',
                  fontWeight: period === val ? '700' : '400',
                  fontSize: '12px', transition: 'all 0.15s',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── KPI strip ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {[
              { label: 'Success rate', value: `${successRate}%`, sub: `${successfulDays} of ${totalDays} days`, color: 'var(--theme-primary)' },
              { label: 'Perfect days', value: perfectDays, sub: 'all habits completed', color: '#C9973A' },
              { label: 'Avg pts / day', value: avgPoints, sub: 'out of 750 max', color: 'var(--theme-text)' },
              { label: 'Best streak', value: `${streak?.longest_streak || 0}d`, sub: `current: ${streak?.current_streak || 0} days`, color: 'var(--theme-text)' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '14px', padding: '14px' }}>
                <p style={{ fontSize: '11px', color: 'var(--theme-text-secondary)', marginBottom: '4px' }}>{kpi.label}</p>
                <p style={{ fontSize: '24px', fontWeight: '800', color: kpi.color, lineHeight: 1 }}>{kpi.value}</p>
                <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '3px' }}>{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Calendar heatmap ── */}
          <div style={card}>
            {/* Month navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={prevMonth}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--theme-border)', background: 'var(--theme-card)', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ‹
              </button>
              <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)' }}>
                {formatMonth(calYear, calMonthIdx)}
              </p>
              <button onClick={nextMonth} disabled={isCurrentMonth}
                style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--theme-border)', background: 'var(--theme-card)', cursor: isCurrentMonth ? 'not-allowed' : 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isCurrentMonth ? 0.3 : 1 }}>
                ›
              </button>
            </div>

            {/* Day of week headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: '700', color: 'var(--theme-text-muted)', padding: '2px 0' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calDays.map((day, i) => (
                <div key={i} style={{
                  aspectRatio: '1', borderRadius: '6px',
                  background: day ? calColor(day.status) : 'transparent',
                  border: day?.date === today ? '2px solid var(--theme-primary)' : '1px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: day?.status === 'inactive' ? 0.3 : 1,
                  position: 'relative',
                }}>
                  {day && (
                    <span style={{
                      fontSize: '10px', fontWeight: '600',
                      color: day.status === 'future' ? 'var(--theme-text-muted)'
                        : (day.status === 'inactive') ? 'var(--theme-text-muted)'
                          : 'white',
                    }}>
                      {day.day}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { color: '#C9973A', label: 'Perfect day' },
                { color: 'var(--theme-primary)', label: 'Successful' },
                { color: 'var(--theme-secondary)', label: 'Miss' },
                { color: 'var(--theme-border)', label: 'Inactive' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color }} />
                  <span style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>{l.label}</span>
                </div>
              ))}
            </div>

            {/* Month summary */}
            {(() => {
              const monthStr = `${calYear}-${String(calMonthIdx + 1).padStart(2, '0')}`
              const monthSummaries = summaries.filter(s => s.date.startsWith(monthStr) && s.submitted)
              if (monthSummaries.length === 0) return null
              const monthSuccess = monthSummaries.filter(s => s.day_successful).length
              const monthPerfect = monthSummaries.filter(s => s.perfect_day).length
              const monthRate = Math.round((monthSuccess / monthSummaries.length) * 100)
              return (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--theme-border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                  {[
                    { label: 'Days logged', value: monthSummaries.length },
                    { label: 'Successful', value: `${monthSuccess} (${monthRate}%)` },
                    { label: 'Perfect', value: monthPerfect },
                  ].map(s => (
                    <div key={s.label}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)' }}>{s.value}</p>
                      <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>

          {/* ── Points sparkline ── */}
          {sparklineDays.some(d => d.points > 0) && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '2px' }}>Points — last 30 days</h3>
                  {recentTrend !== null && (
                    <p style={{ fontSize: '12px', color: recentTrend >= 0 ? 'var(--theme-primary)' : 'var(--theme-secondary)', fontWeight: '600' }}>
                      {recentTrend >= 0 ? `▲ ${recentTrend}%` : `▼ ${Math.abs(recentTrend)}%`} vs previous 15 days
                    </p>
                  )}
                </div>
                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text)' }}>{avgPoints} avg</p>
              </div>

              {/* Sparkline bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '60px' }}>
                {sparklineDays.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{
                      width: '100%',
                      height: d.points > 0 ? `${Math.max((d.points / maxSparkPoints) * 56, 3)}px` : '2px',
                      background: d.status === 'perfect' ? '#C9973A' : d.status === 'success' ? 'var(--theme-primary)' : d.status === 'miss' ? 'var(--theme-secondary)' : 'var(--theme-border)',
                      borderRadius: '2px 2px 0 0',
                      opacity: d.points > 0 ? 0.9 : 0.3,
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>30 days ago</span>
                <span style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>Today</span>
              </div>
            </div>
          )}

          {/* ── Best day of week ── */}
          {bestDay && (
            <div style={card}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '12px' }}>Day of week</h3>

              {/* Insight cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                <div style={{ background: 'var(--theme-primary-light)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', marginBottom: '4px' }}>Strongest day</p>
                  <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--theme-primary)' }}>{bestDay.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--theme-primary)', fontWeight: '600', marginTop: '2px' }}>{bestDay.rate}% success rate</p>
                </div>
                {worstDay && worstDay.name !== bestDay.name && (
                  <div style={{ background: '#fef2f2', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                    <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', marginBottom: '4px' }}>Needs attention</p>
                    <p style={{ fontSize: '20px', fontWeight: '800', color: '#dc2626' }}>{worstDay.name}</p>
                    <p style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600', marginTop: '2px' }}>{worstDay.rate}% success rate</p>
                  </div>
                )}
              </div>

              {/* Bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '64px' }}>
                {dayStats.map(d => {
                  const maxRate = Math.max(...daysWithData.map(x => x.rate), 1)
                  const isBest = d.name === bestDay?.name
                  const isWorst = d.name === worstDay?.name
                  return (
                    <div key={d.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '3px' }}>
                      <div style={{
                        width: '100%',
                        height: d.rate !== null ? `${Math.max((d.rate / maxRate) * 52, 4)}px` : '4px',
                        background: isBest ? 'var(--theme-primary)' : isWorst ? 'var(--theme-secondary)' : 'var(--theme-primary-light)',
                        borderRadius: '3px 3px 0 0', transition: 'height 0.3s',
                      }} />
                      <p style={{ fontSize: '9px', color: isBest ? 'var(--theme-primary)' : isWorst ? 'var(--theme-secondary)' : 'var(--theme-text-muted)', fontWeight: (isBest || isWorst) ? '700' : '400' }}>{d.short}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Habit completion rates ── */}
          {habitRates.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>Habit completion</h3>
              <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '16px' }}>All time · Sorted best to worst</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {habitRates.map(h => (
                  <div key={h.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px' }}>{h.icon}</span>
                        <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{h.label}</span>
                        <span style={{
                          fontSize: '9px', fontWeight: '700', padding: '1px 5px', borderRadius: '6px',
                          background: h.type === 'core' ? 'var(--theme-primary-light)' : h.type === 'custom' ? '#fef3e2' : '#f0eef7',
                          color: h.type === 'core' ? 'var(--theme-primary)' : h.type === 'custom' ? '#C9973A' : '#7B6BAA',
                        }}>
                          {h.type.toUpperCase()}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: h.rate >= 80 ? 'var(--theme-primary)' : h.rate >= 50 ? '#C9973A' : 'var(--theme-secondary)' }}>
                        {h.rate}%
                      </span>
                    </div>
                    <div style={{ background: 'var(--theme-primary-light)', borderRadius: '4px', height: '6px' }}>
                      <div style={{
                        background: h.rate >= 80 ? 'var(--theme-primary)' : h.rate >= 50 ? '#C9973A' : 'var(--theme-secondary)',
                        borderRadius: '4px', height: '6px', width: `${h.rate}%`, transition: 'width 0.4s',
                      }} />
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>
                      {h.completed} of {h.total} days
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Milestone progress (Plus/Premium only) ── */}
          {milestones.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>Reward milestones</h3>
              <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '16px' }}>
                {currentSuccessfulDays} successful days this month
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {milestones.filter(m => m.days).map(m => {
                  const reached = currentSuccessfulDays >= m.days
                  const progress = Math.min((currentSuccessfulDays / m.days) * 100, 100)
                  const daysLeft = Math.max(m.days - currentSuccessfulDays, 0)
                  return (
                    <div key={m.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>{reached ? '✅' : '🎯'}</span>
                          <span style={{ fontSize: '13px', color: 'var(--theme-text)', fontWeight: reached ? '700' : '400' }}>{m.label}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: reached ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
                          {m.bonus}
                        </span>
                      </div>
                      <div style={{ background: 'var(--theme-primary-light)', borderRadius: '4px', height: '8px' }}>
                        <div style={{
                          background: reached ? 'var(--theme-primary)' : '#C9973A',
                          borderRadius: '4px', height: '8px', width: `${progress}%`, transition: 'width 0.4s',
                        }} />
                      </div>
                      <p style={{ fontSize: '10px', color: reached ? 'var(--theme-primary)' : 'var(--theme-text-muted)', marginTop: '3px', fontWeight: reached ? '600' : '400' }}>
                        {reached ? `✓ Unlocked — ${m.days} days reached!` : `${daysLeft} more successful ${daysLeft === 1 ? 'day' : 'days'} to unlock`}
                      </p>
                    </div>
                  )
                })}

                {/* Successful month and perfect month — special */}
                {milestones.filter(m => m.special).map(m => {
                  const isSuccessfulMonth = currentSuccessfulDays > 0 && currentSuccessfulDays === (profile?.total_days_logged || 0)
                  const reached = isSuccessfulMonth
                  return (
                    <div key={m.label} style={{ background: m.gold ? '#fffbeb' : 'var(--theme-primary-light)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px' }}>{m.gold ? '🏆' : '🌟'}</span>
                          <span style={{ fontSize: '13px', fontWeight: '700', color: m.gold ? '#92400e' : 'var(--theme-primary)' }}>{m.label}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: m.gold ? '#C9973A' : 'var(--theme-primary)' }}>{m.bonus}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: m.gold ? '#78350f' : 'var(--theme-text-secondary)', marginTop: '6px', lineHeight: '1.4' }}>
                        {m.gold
                          ? 'Complete every submitted day perfectly — all 9 habits — to earn this bonus.'
                          : 'Make every submitted day a successful day this month to earn this bonus.'}
                      </p>
                      {reached && <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-primary)', marginTop: '4px' }}>✓ On track!</p>}
                    </div>
                  )
                })}
              </div>

              {/* Free/Basic upsell */}
              {milestones.length === 0 && (
                <div style={{ background: 'var(--theme-primary-light)', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                  <p style={{ fontSize: '13px', color: 'var(--theme-primary)', lineHeight: '1.6' }}>
                    Upgrade to Plus or Premium to unlock milestone bonuses — earn up to <strong>$45/month</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Upsell for free/basic */}
          {milestones.length === 0 && (
            <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '8px' }}>🎯 Reward milestones</h3>
              <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
                Upgrade to Plus or Premium to unlock milestone bonuses — earn extra rewards at 10 days, 20 days, and for a successful or perfect month.
              </p>
              <div style={{ background: 'var(--theme-primary)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>Plus — $4.99/month</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>Up to $17.50/mo →</span>
              </div>
            </div>
          )}
          {/* ── Mood trend ── */}
          {(() => {
            const moodData = filteredSummaries
              .filter(s => s.mood && s.submitted)
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .slice(-30)

            if (moodData.length === 0) return null

            const MOOD_EMOJIS = ['😩', '😕', '😐', '😊', '🔥']
            const MOOD_LABELS = ['Rough', 'Not great', 'Okay', 'Good', 'Amazing']
            const MOOD_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#8B5CF6']

            const avgMood = moodData.reduce((s, d) => s + d.mood, 0) / moodData.length
            const successMoods = moodData.filter(d => d.day_successful)
            const missedMoods = moodData.filter(d => !d.day_successful)
            const avgSuccessMood = successMoods.length > 0
              ? successMoods.reduce((s, d) => s + d.mood, 0) / successMoods.length : null
            const avgMissedMood = missedMoods.length > 0
              ? missedMoods.reduce((s, d) => s + d.mood, 0) / missedMoods.length : null

            return (
              <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>Mood trend</h3>
                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '16px' }}>
                  How you felt on days you submitted — last {moodData.length} entries
                </p>

                {/* Mood bar chart */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px', marginBottom: '16px' }}>
                  {moodData.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <div style={{
                        width: '100%', borderRadius: '4px 4px 0 0',
                        height: `${(d.mood / 5) * 52}px`,
                        background: MOOD_COLORS[d.mood - 1],
                        opacity: d.day_successful ? 1 : 0.4,
                        transition: 'height 0.3s ease',
                        minHeight: '4px',
                      }} />
                    </div>
                  ))}
                </div>

                {/* Average mood */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', background: 'var(--theme-bg)', borderRadius: '10px', padding: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{MOOD_EMOJIS[Math.round(avgMood) - 1]}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text)' }}>
                      Average mood: {avgMood.toFixed(1)}/5
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>
                      {MOOD_LABELS[Math.round(avgMood) - 1]} — across {moodData.length} recorded days
                    </p>
                  </div>
                </div>

                {/* Successful vs missed comparison */}
                {avgSuccessMood && avgMissedMood && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <p style={{ fontSize: '20px', marginBottom: '4px' }}>{MOOD_EMOJIS[Math.round(avgSuccessMood) - 1]}</p>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-primary)' }}>{avgSuccessMood.toFixed(1)}/5</p>
                      <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>Successful days</p>
                    </div>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                      <p style={{ fontSize: '20px', marginBottom: '4px' }}>{MOOD_EMOJIS[Math.round(avgMissedMood) - 1]}</p>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#dc2626' }}>{avgMissedMood.toFixed(1)}/5</p>
                      <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>Missed days</p>
                    </div>
                  </div>
                )}

                {/* Insight */}
                {avgSuccessMood && avgMissedMood && avgSuccessMood > avgMissedMood && (
                  <div style={{ background: 'var(--theme-primary-light)', borderRadius: '8px', padding: '10px 12px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--theme-primary)', lineHeight: '1.5' }}>
                      💡 You feel <strong>{(avgSuccessMood - avgMissedMood).toFixed(1)} points better</strong> on days you complete your habits vs days you miss them.
                    </p>
                  </div>
                )}

                {/* Mood legend */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                  {MOOD_EMOJIS.map((emoji, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '14px' }}>{emoji}</span>
                      <p style={{ fontSize: '9px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>{i + 1}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', marginTop: '8px', textAlign: 'center' }}>
                  Faded bars = missed days · Full bars = successful days
                </p>
              </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
