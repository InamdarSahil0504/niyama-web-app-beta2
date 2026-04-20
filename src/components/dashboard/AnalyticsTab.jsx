import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { CORE_HABITS, LIBRARY_HABITS, getTodayString } from '../../config'

export default function AnalyticsTab({ session, profile, streak, userHabits }) {
  const [summaries, setSummaries]   = useState([])
  const [logs, setLogs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [period, setPeriod]         = useState('30') // '30' | '90' | 'all'

  const userId = session.user.id

  useEffect(() => { fetchData() }, [period])

  async function fetchData() {
    setLoading(true)
    const now = new Date()

    let fromDate = null
    if (period === '30') {
      fromDate = new Date(now)
      fromDate.setDate(now.getDate() - 30)
    } else if (period === '90') {
      fromDate = new Date(now)
      fromDate.setDate(now.getDate() - 90)
    }

    const fromStr = fromDate
      ? fromDate.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
      : null

    // Load daily summaries
    let summaryQuery = supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', userId)
      .eq('submitted', true)
      .order('summary_date', { ascending: true })
    if (fromStr) summaryQuery = summaryQuery.gte('summary_date', fromStr)
    const { data: summaryData } = await summaryQuery
    setSummaries(summaryData || [])

    // Load habit logs
    let logQuery = supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: true })
    if (fromStr) logQuery = logQuery.gte('log_date', fromStr)
    const { data: logData } = await logQuery
    setLogs(logData || [])

    setLoading(false)
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalDays      = summaries.length
  const successfulDays = summaries.filter(s => s.day_successful).length
  const perfectDays    = summaries.filter(s => s.perfect_day).length
  const successRate    = totalDays > 0 ? Math.round((successfulDays / totalDays) * 100) : 0
  const totalPoints    = summaries.reduce((sum, s) => sum + (s.points_earned || 0), 0)
  const avgPoints      = totalDays > 0 ? Math.round(totalPoints / totalDays) : 0

  // ── Habit completion rates ─────────────────────────────────────────────────
  const libraryKeys = userHabits
    ? [userHabits.library_habit_1, userHabits.library_habit_2, userHabits.library_habit_3, userHabits.library_habit_4].filter(Boolean)
    : ['sunlight', 'hydration', 'meditation', 'no_late_food']

  const allHabitKeys = [
    ...CORE_HABITS.map(h => h.key),
    ...libraryKeys,
    ...(userHabits?.custom_habit_1_label ? ['custom_1'] : []),
    ...(userHabits?.custom_habit_2_label ? ['custom_2'] : []),
  ]

  const habitCompletionRates = allHabitKeys.map(key => {
    const keyLogs    = logs.filter(l => l.habit_key === key)
    const completed  = keyLogs.filter(l => l.completed).length
    const total      = keyLogs.length
    const rate       = total > 0 ? Math.round((completed / total) * 100) : 0
    const coreHabit  = CORE_HABITS.find(h => h.key === key)
    const libHabit   = LIBRARY_HABITS.find(h => h.key === key)
    const label = coreHabit?.label || libHabit?.label
      || (key === 'custom_1' ? userHabits?.custom_habit_1_label : userHabits?.custom_habit_2_label)
      || key
    const icon = coreHabit?.icon || libHabit?.icon || '⭐'
    const type = coreHabit ? 'core' : key.startsWith('custom') ? 'custom' : 'library'
    return { key, label, icon, rate, completed, total, type }
  }).filter(h => h.total > 0)

  // ── Day of week breakdown ──────────────────────────────────────────────────
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayStats = dayNames.map((name, i) => {
    const daySummaries = summaries.filter(s => new Date(s.summary_date + 'T12:00:00').getDay() === i)
    const daySuccess   = daySummaries.filter(s => s.day_successful).length
    const dayTotal     = daySummaries.length
    const rate         = dayTotal > 0 ? Math.round((daySuccess / dayTotal) * 100) : null
    return { name, rate, total: dayTotal }
  })

  const daysWithData  = dayStats.filter(d => d.rate !== null)
  const bestDay       = daysWithData.length > 0 ? daysWithData.reduce((a, b) => a.rate > b.rate ? a : b) : null
  const worstDay      = daysWithData.length > 0 ? daysWithData.reduce((a, b) => a.rate < b.rate ? a : b) : null
  const maxDayRate    = Math.max(...daysWithData.map(d => d.rate), 1)

  // ── Last 30 days points trend ──────────────────────────────────────────────
  const last30 = summaries.slice(-30)
  const maxPoints = Math.max(...last30.map(s => s.points_earned || 0), 1)

  // ── Calendar heatmap (last 90 days) ───────────────────────────────────────
  const summaryMap = {}
  summaries.forEach(s => { summaryMap[s.summary_date] = s })

  const calendarDays = []
  for (let i = 89; i >= 0; i--) {
    const d   = new Date()
    d.setDate(d.getDate() - i)
    const str = d.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    const s   = summaryMap[str]
    calendarDays.push({
      date: str,
      status: !s ? 'none' : s.perfect_day ? 'perfect' : s.day_successful ? 'success' : 'miss',
      points: s?.points_earned || 0,
    })
  }

  // Pad to start on Sunday
  const firstDayOfWeek = new Date(calendarDays[0].date + 'T12:00:00').getDay()
  const paddedDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...calendarDays,
  ]

  const calColor = (status) => {
    if (status === 'perfect')  return '#C9973A'
    if (status === 'success')  return 'var(--theme-primary)'
    if (status === 'miss')     return '#E05252'
    return 'var(--theme-border)'
  }

  const card = {
    background: 'var(--theme-card)',
    border: '1px solid var(--theme-border)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px',
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', paddingTop:'80px' }}>
      <div style={{ width:'28px', height:'28px', border:'3px solid var(--theme-primary)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'700', color:'var(--theme-text)' }}>Your analytics</h1>
        {/* Period selector */}
        <div style={{ display:'flex', background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'10px', padding:'3px', gap:'2px' }}>
          {[['30','30d'],['90','90d'],['all','All']].map(([val, label]) => (
            <button key={val} onClick={() => setPeriod(val)}
              style={{
                padding:'5px 10px', borderRadius:'7px', border:'none', cursor:'pointer',
                background: period===val ? 'var(--theme-primary)' : 'transparent',
                color: period===val ? 'white' : 'var(--theme-text-muted)',
                fontSize:'12px', fontWeight: period===val ? '700' : '400',
                transition:'all 0.15s',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {totalDays === 0 ? (
        <div style={{ ...card, textAlign:'center', padding:'40px 20px' }}>
          <p style={{ fontSize:'32px', marginBottom:'12px' }}>📊</p>
          <p style={{ fontSize:'16px', fontWeight:'600', color:'var(--theme-text)', marginBottom:'8px' }}>No data yet</p>
          <p style={{ fontSize:'13px', color:'var(--theme-text-muted)', lineHeight:'1.6' }}>
            Submit your first day of habits to start seeing your analytics here.
          </p>
        </div>
      ) : (
        <>
          {/* ── Overview KPIs ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
            {[
              { label:'Days logged',      value: totalDays,       sub: `in last ${period==='all'?'all time':period+' days'}`, color:'var(--theme-text)' },
              { label:'Success rate',     value: `${successRate}%`, sub:`${successfulDays} successful days`, color:'var(--theme-primary)' },
              { label:'Perfect days',     value: perfectDays,     sub:'all habits completed', color:'#C9973A' },
              { label:'Avg points/day',   value: avgPoints,       sub:'out of 750 max', color:'var(--theme-text)' },
            ].map(stat => (
              <div key={stat.label} style={{ background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'14px', padding:'14px' }}>
                <p style={{ fontSize:'11px', color:'var(--theme-text-secondary)', marginBottom:'4px' }}>{stat.label}</p>
                <p style={{ fontSize:'24px', fontWeight:'800', color: stat.color, lineHeight:1 }}>{stat.value}</p>
                <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginTop:'3px' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Streak stats ── */}
          <div style={{ ...card }}>
            <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'14px' }}>🔥 Streak</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
              {[
                { label:'Current',  value: streak?.current_streak || 0, unit:'days' },
                { label:'Longest',  value: streak?.longest_streak  || 0, unit:'days' },
                { label:'This month', value: profile?.successful_days || 0, unit:'successful' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center', background:'var(--theme-primary-light)', borderRadius:'10px', padding:'12px 8px' }}>
                  <p style={{ fontSize:'22px', fontWeight:'800', color:'var(--theme-primary)', lineHeight:1 }}>{s.value}</p>
                  <p style={{ fontSize:'10px', color:'var(--theme-text-muted)', marginTop:'3px' }}>{s.unit}</p>
                  <p style={{ fontSize:'10px', fontWeight:'600', color:'var(--theme-text-secondary)', marginTop:'1px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Calendar heatmap ── */}
          <div style={card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
              <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)' }}>Last 90 days</h3>
              {/* Legend */}
              <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                {[
                  { color:'#C9973A', label:'Perfect' },
                  { color:'var(--theme-primary)', label:'Success' },
                  { color:'#E05252', label:'Miss' },
                ].map(l => (
                  <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:l.color }} />
                    <span style={{ fontSize:'9px', color:'var(--theme-text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day of week labels */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'3px', marginBottom:'3px' }}>
              {['S','M','T','W','T','F','S'].map((d,i) => (
                <div key={i} style={{ textAlign:'center', fontSize:'9px', color:'var(--theme-text-muted)', fontWeight:'600' }}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:'3px' }}>
              {paddedDays.map((day, i) => (
                <div key={i} style={{
                  aspectRatio:'1',
                  borderRadius:'3px',
                  background: day ? calColor(day.status) : 'transparent',
                  opacity: day?.status === 'none' ? 0.25 : 1,
                  title: day?.date,
                }} />
              ))}
            </div>
          </div>

          {/* ── Day of week breakdown ── */}
          {daysWithData.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'8px' }}>Day of week</h3>

              {/* Best / worst callouts */}
              {bestDay && worstDay && bestDay.name !== worstDay.name && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
                  <div style={{ background:'var(--theme-primary-light)', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
                    <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginBottom:'2px' }}>Best day</p>
                    <p style={{ fontSize:'16px', fontWeight:'800', color:'var(--theme-primary)' }}>{bestDay.name}</p>
                    <p style={{ fontSize:'11px', color:'var(--theme-primary)', fontWeight:'600' }}>{bestDay.rate}% success</p>
                  </div>
                  <div style={{ background:'#fef2f2', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
                    <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginBottom:'2px' }}>Needs work</p>
                    <p style={{ fontSize:'16px', fontWeight:'800', color:'#dc2626' }}>{worstDay.name}</p>
                    <p style={{ fontSize:'11px', color:'#dc2626', fontWeight:'600' }}>{worstDay.rate}% success</p>
                  </div>
                </div>
              )}

              {/* Bar chart */}
              <div style={{ display:'flex', alignItems:'flex-end', gap:'6px', height:'80px' }}>
                {dayStats.map(d => (
                  <div key={d.name} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', height:'100%', justifyContent:'flex-end' }}>
                    <div style={{
                      width:'100%',
                      height: d.rate !== null ? `${Math.max((d.rate / maxDayRate) * 64, 4)}px` : '4px',
                      background: d.rate !== null
                        ? (d.name === bestDay?.name ? 'var(--theme-primary)' : d.name === worstDay?.name ? '#E05252' : 'var(--theme-primary-light)')
                        : 'var(--theme-border)',
                      borderRadius:'4px 4px 0 0',
                      transition:'height 0.3s',
                    }} />
                    <p style={{ fontSize:'9px', color:'var(--theme-text-muted)', fontWeight:'600' }}>{d.name}</p>
                    {d.rate !== null && (
                      <p style={{ fontSize:'9px', color:'var(--theme-text-muted)' }}>{d.rate}%</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Points trend (last 30 days) ── */}
          {last30.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'14px' }}>Points trend</h3>
              <div style={{ display:'flex', alignItems:'flex-end', gap:'2px', height:'80px' }}>
                {last30.map((s, i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%' }}>
                    <div style={{
                      width:'100%',
                      height: `${Math.max(((s.points_earned||0) / maxPoints) * 72, 2)}px`,
                      background: s.perfect_day ? '#C9973A' : s.day_successful ? 'var(--theme-primary)' : 'var(--theme-secondary)',
                      borderRadius:'2px 2px 0 0',
                      opacity: 0.85,
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'6px' }}>
                <span style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>30 days ago</span>
                <span style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>Today</span>
              </div>
              <div style={{ display:'flex', gap:'12px', marginTop:'10px', justifyContent:'center' }}>
                {[
                  { color:'#C9973A', label:'Perfect day' },
                  { color:'var(--theme-primary)', label:'Successful' },
                  { color:'var(--theme-secondary)', label:'Miss' },
                ].map(l => (
                  <div key={l.label} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:l.color }} />
                    <span style={{ fontSize:'10px', color:'var(--theme-text-muted)' }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Habit completion rates ── */}
          {habitCompletionRates.length > 0 && (
            <div style={card}>
              <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'14px' }}>Habit completion</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {habitCompletionRates
                  .sort((a, b) => b.rate - a.rate)
                  .map(h => (
                    <div key={h.key}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{ fontSize:'14px' }}>{h.icon}</span>
                          <span style={{ fontSize:'12px', color:'var(--theme-text-secondary)' }}>{h.label}</span>
                          <span style={{ fontSize:'9px', fontWeight:'700', padding:'1px 5px', borderRadius:'6px',
                            background: h.type==='core' ? 'var(--theme-primary-light)' : h.type==='custom' ? '#fef3e2' : '#f0eef7',
                            color: h.type==='core' ? 'var(--theme-primary)' : h.type==='custom' ? '#C9973A' : '#7B6BAA',
                          }}>
                            {h.type.toUpperCase()}
                          </span>
                        </div>
                        <span style={{ fontSize:'12px', fontWeight:'700', color: h.rate>=80?'var(--theme-primary)':h.rate>=50?'#C9973A':'var(--theme-secondary)' }}>
                          {h.rate}%
                        </span>
                      </div>
                      <div style={{ background:'var(--theme-primary-light)', borderRadius:'4px', height:'6px' }}>
                        <div style={{
                          background: h.rate>=80?'var(--theme-primary)':h.rate>=50?'#C9973A':'var(--theme-secondary)',
                          borderRadius:'4px', height:'6px',
                          width:`${h.rate}%`, transition:'width 0.3s',
                        }} />
                      </div>
                      <p style={{ fontSize:'10px', color:'var(--theme-text-muted)', marginTop:'2px' }}>
                        {h.completed} of {h.total} days
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* ── Monthly comparison ── */}
          <MonthlyComparison summaries={summaries} />
        </>
      )}
    </div>
  )
}

// ── Monthly comparison component ──────────────────────────────────────────────
function MonthlyComparison({ summaries }) {
  const now       = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
  const lastMonth = new Date(now.getFullYear(), now.getMonth()-1, 1)
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth()+1).padStart(2,'0')}`

  const thisMonthData = summaries.filter(s => s.summary_date.startsWith(thisMonth))
  const lastMonthData = summaries.filter(s => s.summary_date.startsWith(lastMonthStr))

  if (thisMonthData.length === 0 && lastMonthData.length === 0) return null

  const thisSuccess  = thisMonthData.filter(s => s.day_successful).length
  const lastSuccess  = lastMonthData.filter(s => s.day_successful).length
  const thisPoints   = thisMonthData.reduce((s,r) => s+(r.points_earned||0), 0)
  const lastPoints   = lastMonthData.reduce((s,r) => s+(r.points_earned||0), 0)
  const thisPerfect  = thisMonthData.filter(s => s.perfect_day).length
  const lastPerfect  = lastMonthData.filter(s => s.perfect_day).length

  const card = { background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'16px', padding:'20px', marginBottom:'16px' }

  return (
    <div style={card}>
      <h3 style={{ fontSize:'15px', fontWeight:'700', color:'var(--theme-text)', marginBottom:'14px' }}>This month vs last</h3>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
        {[
          { label:'Successful days', this: thisSuccess,  last: lastSuccess  },
          { label:'Points earned',   this: thisPoints,   last: lastPoints   },
          { label:'Perfect days',    this: thisPerfect,  last: lastPerfect  },
        ].map(stat => {
          const diff   = stat.this - stat.last
          const up     = diff > 0
          const same   = diff === 0
          return (
            <div key={stat.label} style={{ background:'var(--theme-primary-light)', borderRadius:'10px', padding:'12px', textAlign:'center' }}>
              <p style={{ fontSize:'10px', color:'var(--theme-text-muted)', marginBottom:'4px', lineHeight:'1.3' }}>{stat.label}</p>
              <p style={{ fontSize:'20px', fontWeight:'800', color:'var(--theme-primary)', lineHeight:1 }}>{stat.this}</p>
              {stat.last > 0 && (
                <p style={{ fontSize:'10px', marginTop:'3px', color: same?'var(--theme-text-muted)':up?'var(--theme-primary)':'var(--theme-secondary)', fontWeight:'600' }}>
                  {same ? '—' : up ? `▲ ${diff}` : `▼ ${Math.abs(diff)}`}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
