import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

// ─── Design tokens ────────────────────────────────────────────────────────────
const PRIMARY   = '#4A7A68'
const SECONDARY = '#C96A52'
const GOLD      = '#C9973A'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toLocaleDateString('en-CA'))
  }
  return days
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function shortDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)
}

function avg(arr, key) {
  const vals = arr.map(r => r[key]).filter(v => v != null && v > 0)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

function trendArrow(current, average) {
  if (current == null || average == null) return null
  const diff = ((current - average) / average) * 100
  if (Math.abs(diff) < 2) return { dir: 'flat', pct: 0 }
  return diff > 0
    ? { dir: 'up', pct: Math.round(diff) }
    : { dir: 'down', pct: Math.round(Math.abs(diff)) }
}

// For resting HR, lower is better; for everything else, higher is better
function trendColor(dir, lowerIsBetter = false) {
  if (dir === 'flat') return 'var(--theme-text-muted)'
  const isGood = lowerIsBetter ? dir === 'down' : dir === 'up'
  return isGood ? PRIMARY : SECONDARY
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--theme-card)',
      border: '1px solid var(--theme-border)',
      borderRadius: '16px',
      padding: '18px 20px',
      marginBottom: '12px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: '700',
      color: 'var(--theme-text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: '10px', marginTop: '4px',
    }}>
      {children}
    </p>
  )
}

function MetricCard({ icon, label, value, unit, trend, lowerIsBetter, children }) {
  const arrow = trend ? (trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '→') : null
  const color = trend ? trendColor(trend.dir, lowerIsBetter) : 'var(--theme-text-muted)'

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {label}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {value ?? '—'}
            </span>
            {unit && value != null && (
              <span style={{ fontSize: '13px', color: 'var(--theme-text-muted)', fontWeight: '500' }}>{unit}</span>
            )}
          </div>
        </div>
        {trend && arrow && (
          <div style={{
            background: color + '18',
            borderRadius: '10px',
            padding: '6px 10px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '48px',
          }}>
            <span style={{ fontSize: '18px', color, lineHeight: 1 }}>{arrow}</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color, marginTop: '2px' }}>
              {trend.pct}%
            </span>
          </div>
        )}
      </div>
      {children}
    </Card>
  )
}

function StepsCard({ steps, goal = 10000 }) {
  const pct = steps != null ? Math.min((steps / goal) * 100, 100) : 0
  const color = pct >= 100 ? GOLD : pct >= 75 ? PRIMARY : pct >= 50 ? '#7AB5A0' : 'var(--theme-border)'

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>👟</span>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Steps Today
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {steps != null ? steps.toLocaleString() : '—'}
            </span>
            {steps != null && (
              <span style={{ fontSize: '13px', color: 'var(--theme-text-muted)', fontWeight: '500' }}>
                / {goal.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        {steps != null && (
          <div style={{
            background: color + '18', borderRadius: '10px',
            padding: '6px 10px', textAlign: 'center', minWidth: '48px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color }}>{Math.round(pct)}%</span>
          </div>
        )}
      </div>
      {steps != null && (
        <div style={{ background: 'var(--theme-border)', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: pct >= 100
              ? `linear-gradient(90deg, ${PRIMARY}, ${GOLD})`
              : PRIMARY,
            borderRadius: '6px',
            transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          }} />
        </div>
      )}
    </Card>
  )
}

function SleepCard({ hours }) {
  const quality = hours == null ? null
    : hours >= 7 && hours <= 9 ? { label: 'Optimal', color: PRIMARY }
    : hours >= 6  ? { label: 'Fair',    color: GOLD }
    : { label: 'Short', color: SECONDARY }

  const h = hours != null ? Math.floor(hours) : null
  const m = hours != null ? Math.round((hours - Math.floor(hours)) * 60) : null

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>😴</span>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Sleep Last Night
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            {hours != null ? (
              <>
                <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {h}<span style={{ fontSize: '16px', fontWeight: '600' }}>h</span>{m > 0 ? ` ${m}` : ''}
                </span>
                {m > 0 && <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--theme-text)' }}>m</span>}
              </>
            ) : (
              <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--theme-text)' }}>—</span>
            )}
          </div>
        </div>
        {quality && (
          <div style={{
            background: quality.color + '18', borderRadius: '10px',
            padding: '6px 12px', textAlign: 'center',
          }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: quality.color }}>{quality.label}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function TrendChart({ data, dataKey, color, unit, label }) {
  if (!data || data.filter(d => d[dataKey] != null).length < 2) return null

  const CustomTooltip = ({ active, payload, label: l }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
        borderRadius: '10px', padding: '8px 12px',
        fontSize: '13px', color: 'var(--theme-text)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}>
        <p style={{ margin: '0 0 2px', fontWeight: '700', color }}>{payload[0].value}{unit}</p>
        <p style={{ margin: 0, color: 'var(--theme-text-muted)', fontSize: '11px' }}>{l}</p>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <div style={{ height: '110px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'var(--theme-text-muted)', fontFamily: 'inherit' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--theme-text-muted)', fontFamily: 'inherit' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: color, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ padding: '0 4px' }}>
      {/* Hero card */}
      <div style={{
        background: `linear-gradient(135deg, ${PRIMARY} 0%, #3D6657 100%)`,
        borderRadius: '20px',
        padding: '32px 24px',
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        <div style={{
          fontSize: '48px', marginBottom: '16px', lineHeight: 1,
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))',
        }}>❤️</div>
        <h2 style={{
          fontSize: '22px', fontWeight: '800', color: '#FFFFFF',
          letterSpacing: '-0.02em', marginBottom: '10px',
        }}>
          Connect Apple Health
        </h2>
        <p style={{
          fontSize: '14px', color: 'rgba(255,255,255,0.82)',
          lineHeight: '1.6', marginBottom: '0',
        }}>
          Your resting heart rate, HRV, sleep, and steps sync automatically from the Niyama iPhone app.
        </p>
      </div>

      {/* Benefit rows */}
      {[
        { icon: '💓', title: 'Resting Heart Rate & HRV', desc: 'Track cardiovascular health and stress recovery daily.' },
        { icon: '😴', title: 'Sleep Analysis', desc: 'Duration and quality scored against your personal baseline.' },
        { icon: '👟', title: 'Steps & Activity', desc: 'Automatic step tracking synced to your habit goals.' },
        { icon: '🧘', title: 'Mindful Minutes', desc: 'Meditation sessions pulled from the Health app.' },
      ].map(item => (
        <Card key={item.title} style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>{item.icon}</span>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)', margin: '0 0 3px' }}>{item.title}</p>
              <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
            </div>
          </div>
        </Card>
      ))}

      {/* CTA */}
      <div style={{
        background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
        borderRadius: '16px', padding: '20px', textAlign: 'center',
        marginTop: '4px',
      }}>
        <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          Download the Niyama Life iPhone app and enable Apple Health to start seeing your health data here.
        </p>
        <a
          href="https://apps.apple.com/app/niyama-life"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            background: PRIMARY, color: '#FFFFFF',
            fontWeight: '700', fontSize: '14px',
            padding: '12px 28px', borderRadius: '10px',
            textDecoration: 'none', letterSpacing: '-0.01em',
          }}
        >
          Download Niyama Life →
        </a>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HealthTab({ session }) {
  const userId = session.user.id
  const [rows, setRows]       = useState(null)   // null = loading
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function load() {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const from = sevenDaysAgo.toLocaleDateString('en-CA')

      const { data, error: err } = await supabase
        .from('health_metrics')
        .select('date, resting_heart_rate, hrv, steps, sleep_duration, mindful_minutes')
        .eq('user_id', userId)
        .gte('date', from)
        .order('date', { ascending: true })

      if (err) setError(err.message)
      else setRows(data ?? [])
    }
    load()
  }, [userId])

  // ── Loading ──────────────────────────────────────────────────────────────
  if (rows === null) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', flexDirection: 'column', gap: '12px' }}>
      <div style={{
        width: '28px', height: '28px',
        border: `3px solid var(--theme-primary)`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>Loading health data…</p>
    </div>
  )

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', color: 'var(--theme-text-muted)' }}>Could not load health data. Try again later.</p>
    </div>
  )

  // ── Empty state ──────────────────────────────────────────────────────────
  if (rows.length === 0) return (
    <div>
      <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
        Health
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '20px' }}>
        Your biometrics from Apple Health
      </p>
      <EmptyState />
    </div>
  )

  // ── Build data ───────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-CA')
  const todayRow = rows.find(r => r.date === today) ?? null
  const priorRows = rows.filter(r => r.date !== today)

  const avgHR  = avg(priorRows.length ? priorRows : rows, 'resting_heart_rate')
  const avgHRV = avg(priorRows.length ? priorRows : rows, 'hrv')

  const hrTrend  = trendArrow(todayRow?.resting_heart_rate, avgHR)
  const hrvTrend = trendArrow(todayRow?.hrv, avgHRV)

  // Chart series — one entry per day (last 7)
  const last7 = getLast7Days()
  const rowByDate = Object.fromEntries(rows.map(r => [r.date, r]))
  const chartData = last7.map(date => ({
    day: shortDay(date),
    date,
    rhr:    rowByDate[date]?.resting_heart_rate ?? null,
    hrv:    rowByDate[date]?.hrv != null ? Math.round(rowByDate[date].hrv) : null,
    steps:  rowByDate[date]?.steps ?? null,
  }))

  const hasToday = todayRow != null
  const hasTrends = rows.length >= 2

  return (
    <div>
      {/* Header */}
      <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--theme-text)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
        Health
      </h1>
      <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '20px' }}>
        {hasToday ? "Today's biometrics from Apple Health" : "Your biometrics from Apple Health"}
      </p>

      {/* Today's snapshot */}
      {hasToday && (
        <>
          <SectionLabel>Today's Snapshot</SectionLabel>

          <MetricCard
            icon="💓"
            label="Resting Heart Rate"
            value={todayRow.resting_heart_rate}
            unit="bpm"
            trend={hrTrend}
            lowerIsBetter
          >
            {avgHR != null && (
              <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '8px', marginBottom: 0 }}>
                7-day avg: {Math.round(avgHR)} bpm
              </p>
            )}
          </MetricCard>

          <MetricCard
            icon="🫀"
            label="Heart Rate Variability"
            value={todayRow.hrv != null ? Math.round(todayRow.hrv) : null}
            unit="ms"
            trend={hrvTrend}
          >
            {avgHRV != null && (
              <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '8px', marginBottom: 0 }}>
                7-day avg: {Math.round(avgHRV)} ms
              </p>
            )}
          </MetricCard>

          <StepsCard steps={todayRow.steps} />
          <SleepCard hours={todayRow.sleep_duration} />

          <MetricCard
            icon="🧘"
            label="Mindful Minutes"
            value={todayRow.mindful_minutes}
            unit="min"
          />
        </>
      )}

      {/* 7-day trends */}
      {hasTrends && (
        <>
          <SectionLabel style={{ marginTop: hasToday ? '8px' : '0' }}>7-Day Trends</SectionLabel>
          <Card>
            <TrendChart
              data={chartData}
              dataKey="hrv"
              color={PRIMARY}
              unit=" ms"
              label="HRV (ms)"
            />
            <TrendChart
              data={chartData}
              dataKey="rhr"
              color={SECONDARY}
              unit=" bpm"
              label="Resting Heart Rate (bpm)"
            />
            <TrendChart
              data={chartData}
              dataKey="steps"
              color={GOLD}
              unit=""
              label="Steps"
            />
          </Card>
        </>
      )}

      {/* No today data but historical exists */}
      {!hasToday && (
        <Card style={{ textAlign: 'center', padding: '24px' }}>
          <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>⏳</span>
          <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', margin: 0, lineHeight: '1.6' }}>
            Today's data hasn't synced yet. Open the Niyama iPhone app to trigger a sync.
          </p>
        </Card>
      )}
    </div>
  )
}
