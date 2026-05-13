import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'

const MOODS = ['😩', '😕', '😐', '😊', '🔥']
const MOOD_LABELS = ['Rough Day', 'Not Great', 'Okay', 'Good Day', 'Amazing']

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function HistoryTab({ session, profile }) {
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'successful' | 'perfect'
  const [expandedDate, setExpandedDate] = useState(null)

  const userId = session.user.id

  useEffect(() => {
    fetchHistory()
  }, [])

  async function fetchHistory() {
    setLoading(true)
    try {
      const { data: summaryData } = await supabase
        .from('daily_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('submitted', true)
        .order('date', { ascending: false })

      setSummaries(summaryData || [])
    } catch (e) {
      console.error('Failed to load history', e)
    }
    setLoading(false)
  }

  const filteredSummaries = summaries.filter(s => {
    if (filter === 'successful') return s.day_successful
    if (filter === 'perfect') return s.perfect_day
    return true
  })

  // Insight line
  const totalLogged = summaries.length
  const lastSuccessful = summaries.find(s => s.day_successful)
  const lastSuccessfulDaysAgo = lastSuccessful
    ? Math.floor((new Date() - new Date(lastSuccessful.date + 'T00:00:00')) / (1000 * 60 * 60 * 24))
    : null

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

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '4px' }}>History</h1>
        <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)' }}>
          {totalLogged === 0
            ? 'No days logged yet.'
            : lastSuccessfulDaysAgo === 0
              ? `You've logged ${totalLogged} day${totalLogged !== 1 ? 's' : ''} · last successful day was today`
              : lastSuccessfulDaysAgo != null
                ? `You've logged ${totalLogged} day${totalLogged !== 1 ? 's' : ''} · last successful day was ${lastSuccessfulDaysAgo} day${lastSuccessfulDaysAgo !== 1 ? 's' : ''} ago`
                : `You've logged ${totalLogged} day${totalLogged !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { value: 'all', label: 'All Days' },
          { value: 'successful', label: 'Successful' },
          { value: 'perfect', label: 'Perfect' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '7px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: filter === f.value ? 'var(--theme-primary)' : 'var(--theme-card)',
              color: filter === f.value ? 'white' : 'var(--theme-text-secondary)',
              boxShadow: filter === f.value ? '0 2px 8px rgba(74,122,104,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {summaries.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '36px', marginBottom: '12px' }}>📋</p>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '6px' }}>No days logged yet</p>
          <p style={{ fontSize: '13px', color: 'var(--theme-text-muted)', lineHeight: '1.6' }}>
            Submit your first day from the Home tab to start building your history.
          </p>
        </div>
      )}

      {/* No results for current filter */}
      {summaries.length > 0 && filteredSummaries.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '32px 20px' }}>
          <p style={{ fontSize: '28px', marginBottom: '10px' }}>🔍</p>
          <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>
            No {filter} days yet. Keep going!
          </p>
        </div>
      )}

      {/* Day list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredSummaries.map(summary => {
          const isExpanded = expandedDate === summary.date
          const isPerfect = summary.perfect_day
          const isSuccessful = summary.day_successful
          const totalCompleted = summary.total_completed || 0
          const totalHabits = summary.total_habits || (3 + (summary.library_total || 7) + (summary.custom_total || 0))

          return (
            <div
              key={summary.date}
              style={{
                background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.2s',
              }}
            >
              {/* Row */}
              <div
                onClick={() => setExpandedDate(isExpanded ? null : summary.date)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)' }}>
                      {formatDate(summary.date)}
                    </span>
                    {isPerfect && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#C9973A', background: 'rgba(201,151,58,0.12)', padding: '2px 8px', borderRadius: '10px' }}>
                        🏆 Perfect
                      </span>
                    )}
                    {!isPerfect && isSuccessful && (
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--theme-primary)', background: 'var(--theme-primary-light)', padding: '2px 8px', borderRadius: '10px' }}>
                        ✅ Successful
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>
                    ✅ {totalCompleted}/{totalHabits} habits
                    {summary.mood ? ` · ${MOODS[summary.mood - 1]}` : ''}
                  </span>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                  <p style={{ fontSize: '18px', fontWeight: '800', color: isSuccessful ? 'var(--theme-primary)' : 'var(--theme-text-muted)', margin: 0 }}>
                    {summary.total_points || 0}
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', margin: 0 }}>pts</p>
                </div>
                <span style={{ fontSize: '14px', color: 'var(--theme-text-muted)', marginLeft: '8px', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                  ›
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid var(--theme-border)', padding: '16px',
                  background: 'var(--theme-bg)',
                }}>
                  {/* Habit breakdown */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ background: 'var(--theme-card)', borderRadius: '10px', padding: '10px 12px', textAlign: 'center', border: '1px solid var(--theme-border)' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--theme-primary)', margin: 0 }}>
                        {summary.core_completed || 0}/3
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', margin: '2px 0 0', fontWeight: '600' }}>Core</p>
                    </div>
                    <div style={{ background: 'var(--theme-card)', borderRadius: '10px', padding: '10px 12px', textAlign: 'center', border: '1px solid var(--theme-border)' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--theme-primary)', margin: 0 }}>
                        {summary.library_completed || 0}/7
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', margin: '2px 0 0', fontWeight: '600' }}>Library</p>
                    </div>
                    <div style={{ background: 'var(--theme-card)', borderRadius: '10px', padding: '10px 12px', textAlign: 'center', border: '1px solid var(--theme-border)' }}>
                      <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--theme-primary)', margin: 0 }}>
                        {summary.custom_completed || 0}
                      </p>
                      <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', margin: '2px 0 0', fontWeight: '600' }}>Personal</p>
                    </div>
                  </div>

                  {/* Points breakdown */}
                  <div style={{ background: 'var(--theme-card)', borderRadius: '10px', padding: '12px', marginBottom: '12px', border: '1px solid var(--theme-border)' }}>
                    <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Points</p>
                    {[
                      { label: 'Core', value: summary.points_from_core || 0 },
                      { label: 'Library', value: summary.points_from_library || 0 },
                      { label: 'Personal', value: summary.points_from_custom || 0 },
                      { label: 'Bonus', value: (summary.bonus_successful_day || 0) + (summary.bonus_perfect_day || 0) },
                    ].filter(row => row.value > 0).map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>{row.label}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>{row.value} pts</span>
                      </div>
                    ))}
                    <div style={{ borderTop: '1px solid var(--theme-border)', paddingTop: '8px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--theme-text)' }}>Total</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--theme-primary)' }}>{summary.total_points || 0} pts</span>
                    </div>
                  </div>

                  {/* Mood */}
                  {summary.mood && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--theme-card)', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--theme-border)' }}>
                      <span style={{ fontSize: '22px' }}>{MOODS[summary.mood - 1]}</span>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text)', margin: 0 }}>{MOOD_LABELS[summary.mood - 1]}</p>
                        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', margin: 0 }}>How you felt</p>
                      </div>
                    </div>
                  )}

                  {/* Day status badges */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {isPerfect && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#C9973A', background: 'rgba(201,151,58,0.12)', padding: '4px 12px', borderRadius: '10px', border: '1px solid rgba(201,151,58,0.3)' }}>
                        🏆 Perfect Day
                      </span>
                    )}
                    {isSuccessful && !isPerfect && (
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-primary)', background: 'var(--theme-primary-light)', padding: '4px 12px', borderRadius: '10px', border: '1px solid var(--theme-primary)' }}>
                        ✅ Successful Day
                      </span>
                    )}
                    {!isSuccessful && (
                      <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--theme-text-muted)', background: 'var(--theme-bg)', padding: '4px 12px', borderRadius: '10px', border: '1px solid var(--theme-border)' }}>
                        💪 Partial Day
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom padding */}
      <div style={{ height: '20px' }} />
    </div>
  )
}
