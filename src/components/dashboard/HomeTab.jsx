import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import MoodCheckIn from './MoodCheckIn'
import {
  CORE_HABITS, LIBRARY_HABITS, POINTS,
  TIER_CONFIG, getEffectiveTier, getMemberMonths,
  calcReward, calcStepsPoints, isDaySuccessful, isDayPerfect,
  trackEvent, getTodayString,
} from '../../config'

const MOODS = ['😩', '😕', '😐', '😊', '🔥']

function Confetti() {
  const colors = ['#5A8A78', '#D4735F', '#7CB9A8', '#E8907A', '#4A7C65', '#C9973A', '#F4D03F', '#85C1E9']
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999, overflow: 'hidden' }}>
      {Array.from({ length: 40 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}px`,
          width: `${Math.random() * 8 + 6}px`, height: `${Math.random() * 8 + 6}px`,
          background: colors[Math.floor(Math.random() * colors.length)],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confetti-fall ${Math.random() * 2 + 2}s linear ${Math.random()}s forwards`, opacity: 0,
        }} />
      ))}
    </div>
  )
}

// Points breakdown modal
function PointsModal({ corePoints, libPoints, custPoints, successBonus, perfectBonus, todayPoints, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--theme-card)', borderRadius: '20px', padding: '24px',
        width: '100%', maxWidth: '340px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--theme-text)', margin: 0 }}>Points Breakdown</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--theme-text-muted)', padding: '4px' }}>×</button>
        </div>
        {[
          { label: 'Core habits', value: corePoints },
          { label: 'Library habits', value: libPoints },
          { label: 'Personal habits', value: custPoints },
          { label: 'Bonus (successful/perfect)', value: successBonus + perfectBonus },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', marginBottom: '12px', borderBottom: '1px solid var(--theme-border)' }}>
            <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>{row.label}</span>
            <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--theme-text)' }}>{row.value} pts</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-text)' }}>Total</span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--theme-primary)' }}>{todayPoints} pts</span>
        </div>
      </div>
    </div>
  )
}

export default function HomeTab({
  session, profile, streak, streakFreeze, userHabits, todayLogs, todaySummary,
  weekSummaries, habitState, setHabitState, stepCount, setStepCount,
  isMinor, today, onRefresh
}) {
  const userId = session.user.id

  const [saving, setSaving] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [prevDaySuccessful, setPrevDaySuccessful] = useState(false)
  const [showMoodCheckIn, setShowMoodCheckIn] = useState(false)
  const [todayMood, setTodayMood] = useState(todaySummary?.mood || null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [customHabits, setCustomHabits] = useState([])
  const [showPointsModal, setShowPointsModal] = useState(false)

  useEffect(() => { setTodayMood(todaySummary?.mood || null) }, [todaySummary])

  // ── Load custom habits from custom_habits table ────────────────────────────
  useEffect(() => {
    async function loadCustomHabits() {
      const { data, error } = await supabase
        .from('custom_habits')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('sort_order')
      if (!error && data) {
        setCustomHabits(data.map((row, i) => ({
          id: row.id,
          key: `custom_habit_${i}`,
          label: row.name,
          emoji: row.emoji || '⭐',
          sort_order: row.sort_order,
        })))
      }
    }
    loadCustomHabits()
  }, [userId])

  // ── Tier info ──────────────────────────────────────────────────────────────
  const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const tierConfig = TIER_CONFIG[effectiveTier]

  // ── Build habit lists ──────────────────────────────────────────────────────
  // Library habits: always all 7 LIBRARY_HABITS (fixed for all users)
  const libraryHabits = LIBRARY_HABITS

  // ── Completion counts ──────────────────────────────────────────────────────
  const coreCompleted = CORE_HABITS.filter(h => habitState[h.key]).length
  const libraryCompleted = libraryHabits.filter(h => habitState[h.key]).length
  const customCompleted = customHabits.filter(h => habitState[h.key]).length
  const totalCompleted = coreCompleted + libraryCompleted + customCompleted
  const daySuccessful = isDaySuccessful(coreCompleted, libraryCompleted)
  const dayPerfect = isDayPerfect(coreCompleted, libraryCompleted)
  const isSubmitted = !!todaySummary?.submitted

  // ── Streak freeze ──────────────────────────────────────────────────────────
  const canUseFreeze = effectiveTier === 'plus' || effectiveTier === 'premium'
  const freezeUsed = !!streakFreeze
  const freezeAvailable = canUseFreeze && !freezeUsed

  async function applyStreakFreeze() {
    if (!freezeAvailable) return
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const missedDate = yesterday.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    try {
      await supabase.rpc('apply_streak_freeze', { p_user_id: userId, p_missed_date: missedDate })
      trackEvent(supabase, userId, 'streak_freeze_used', { streak_saved: streak?.current_streak || 0 })
      window.posthog?.capture('streak_freeze_used', { streak_saved: streak?.current_streak || 0 })
      await onRefresh()
    } catch (e) { console.error('Freeze failed', e) }
  }

  // ── Live points ────────────────────────────────────────────────────────────
  const stepsPoints = calcStepsPoints(stepCount)
  const wakePoints = habitState['wake'] ? 100 : 0
  const sleepPoints = habitState['sleep'] ? 100 : 0
  const stepsChecked = !!habitState['steps']
  const corePoints = wakePoints + sleepPoints + (stepsChecked ? stepsPoints : 0)
  const libPoints = libraryCompleted * POINTS.library_habit
  // Custom habit points by tier
  const customPointsPerHabit = customHabits.map((_, idx) => {
    if (effectiveTier === 'premium' && idx < 4) return 25
    if (effectiveTier === 'plus' && idx < 2) return 25
    return 0
  })
  const custPoints = customHabits.reduce((sum, h, idx) => {
    return sum + (habitState[h.key] ? customPointsPerHabit[idx] : 0)
  }, 0)
  const successBonus = daySuccessful ? POINTS.successful_day : 0
  const perfectBonus = dayPerfect ? POINTS.perfect_day : 0
  const todayPoints = corePoints + libPoints + custPoints + successBonus + perfectBonus

  // ── Reward calculations ────────────────────────────────────────────────────
  const memberMonths = getMemberMonths(profile?.created_at)
  const isFreeTrial = effectiveTier === 'free_trial'
  const isFreeExpired = effectiveTier === 'free_expired'
  const successfulDays = profile?.successful_days || 0
  const isSuccessfulMonth = (profile?.total_days_logged || 0) > 0 && successfulDays === (profile?.total_days_logged || 0)
  const isPerfectMonth = isSuccessfulMonth
  const isInactive = (profile?.consecutive_inactive_days || 0) >= 5
  const minDays = tierConfig?.min_days || 0
  const isEligible = minDays > 0 && successfulDays >= minDays && !isInactive
  const trialMonthsLeft = Math.max(3 - memberMonths, 0)
  const maxCap = tierConfig?.max_cap || tierConfig?.reward_cap || 0
  const reward = isMinor ? '0.00' : calcReward(
    profile?.monthly_points || 0, effectiveTier,
    successfulDays, isSuccessfulMonth, isPerfectMonth,
    profile?.consecutive_inactive_days || 0
  )
  const rewardNum = parseFloat(reward)
  const capProgress = maxCap > 0 ? Math.min((rewardNum / maxCap) * 100, 100) : 0
  const isFirstTimeUser = (profile?.total_days_logged || 0) === 0 && !isSubmitted

  // ── Confetti: fires when daySuccessful becomes true (once per day) ─────────
  useEffect(() => {
    if (daySuccessful && !prevDaySuccessful && !isSubmitted) {
      const confettiKey = `niyama_confetti_${today}`
      if (!localStorage.getItem(confettiKey)) {
        localStorage.setItem(confettiKey, '1')
        setShowCelebration(true)
        setTimeout(() => setShowCelebration(false), 3500)
      }
    }
    setPrevDaySuccessful(daySuccessful)
  }, [daySuccessful])

  // ── Toggle habit ───────────────────────────────────────────────────────────
  async function toggleHabit(habitKey, checked, habitType) {
    if (isSubmitted) return
    setHabitState(prev => ({ ...prev, [habitKey]: checked }))
    try {
      const isCore = CORE_HABITS.find(h => h.key === habitKey)
      const isCustom = habitKey.startsWith('custom_habit_')
      const resolvedType = habitType || (isCore ? 'core' : isCustom ? 'custom' : 'library')
      const pts = checked
        ? (isCore ? (habitKey === 'steps' ? stepsPoints : 100) : isCustom ? (customPointsPerHabit[parseInt(habitKey.split('_')[2])] || 0) : POINTS.library_habit)
        : 0
      const habitLabel = isCore
        ? CORE_HABITS.find(h => h.key === habitKey)?.label
        : isCustom
          ? customHabits.find(h => h.key === habitKey)?.label
          : libraryHabits.find(h => h.key === habitKey)?.label
      await supabase.from('habit_logs').upsert({
        user_id: userId, date: today, habit_key: habitKey,
        habit_type: resolvedType, habit_label: habitLabel || habitKey,
        completed: checked, points_earned: checked ? pts : 0,
      }, { onConflict: 'user_id,date,habit_key' })
      trackEvent(supabase, userId, 'habit_checked', { habit_key: habitKey, type: resolvedType })
      window.posthog?.capture('habit_logged', { habit_key: habitKey, habit_type: resolvedType, completed: checked })
    } catch (e) { console.error('Auto-save failed', e) }
  }

  // ── Mood handlers ──────────────────────────────────────────────────────────
  async function handleMoodSelect(moodValue) {
    setTodayMood(moodValue)
    setShowMoodCheckIn(false)
    await supabase.from('daily_summaries').update({ mood: moodValue }).eq('user_id', userId).eq('date', today)
  }

  function handleMoodSkip() { setShowMoodCheckIn(false) }

  // ── Submit day ─────────────────────────────────────────────────────────────
  async function submitDay() {
    if (isSubmitted || saving) return
    setSaving(true)
    try {
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const libraryPointsTotal = libraryCompleted * POINTS.library_habit
      const customPointsTotal = custPoints
      const bonusSuccessful = daySuccessful ? POINTS.successful_day : 0
      const bonusPerfect = dayPerfect ? POINTS.perfect_day : 0

      const summaryPayload = {
        user_id: userId, date: today,
        core_total: CORE_HABITS.length, core_completed: coreCompleted,
        library_total: libraryHabits.length, library_completed: libraryCompleted,
        custom_total: customHabits.length, custom_completed: customCompleted,
        total_habits: 3 + libraryHabits.length + customHabits.length,
        total_completed: totalCompleted,
        day_successful: daySuccessful, perfect_day: dayPerfect,
        points_from_core: corePoints, points_from_library: libraryPointsTotal,
        points_from_custom: customPointsTotal,
        bonus_successful_day: bonusSuccessful, bonus_perfect_day: bonusPerfect,
        total_points: todayPoints, submitted: true, submitted_at: now.toISOString(),
      }

      const { data: existingSummary } = await supabase
        .from('daily_summaries').select('id').eq('user_id', userId).eq('date', today).maybeSingle()
      if (existingSummary) {
        await supabase.from('daily_summaries').update(summaryPayload).eq('id', existingSummary.id)
      } else {
        await supabase.from('daily_summaries').insert(summaryPayload)
      }

      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const { data: monthSummaries } = await supabase
        .from('daily_summaries').select('total_points, day_successful').eq('user_id', userId).gte('date', monthStart)
      const monthlyPoints = monthSummaries?.reduce((s, r) => s + (r.total_points || 0), 0) || 0
      const successfulDaysNew = monthSummaries?.filter(r => r.day_successful).length || 0

      let newStreak = streak?.current_streak || 0
      let newLongest = streak?.longest_streak || 0
      if (daySuccessful) { newStreak += 1; if (newStreak > newLongest) newLongest = newStreak }
      else newStreak = 0
      await supabase.from('streaks').update({
        current_streak: newStreak, longest_streak: newLongest, updated_at: now.toISOString(),
      }).eq('user_id', userId)

      const { data: allSummaries } = await supabase
        .from('daily_summaries').select('day_successful').eq('user_id', userId)
      const overallSuccessful = allSummaries?.filter(r => r.day_successful).length || 0
      const totalDaysLogged = allSummaries?.length || 0
      const isFirstEver = totalDaysLogged === 1
      await supabase.from('profiles').update({
        monthly_points: monthlyPoints, successful_days: successfulDaysNew,
        consecutive_inactive_days: 0, last_active_date: today,
        overall_successful_days: overallSuccessful, total_days_logged: totalDaysLogged,
        ...(isFirstEver && { first_submission_date: today }),
      }).eq('id', userId)

      const tierCfg = TIER_CONFIG[effectiveTier]
      if (tierCfg && tierCfg.reward_cap > 0) {
        const potentialReward = monthlyPoints / 1000
        const actualReward = isEligible ? Math.min(potentialReward, tierCfg.reward_cap) : 0
        const pointsLeftOnTable = Math.max(potentialReward - tierCfg.reward_cap, 0)
        const capUtil = Math.min(Math.round((potentialReward / tierCfg.reward_cap) * 100), 100)
        const { data: existingReward } = await supabase
          .from('rewards').select('id, manual_override').eq('user_id', userId).eq('month', currentMonth).maybeSingle()
        if (existingReward) {
          if (!existingReward.manual_override) {
            await supabase.from('rewards').update({
              points_earned: monthlyPoints, reward_value: actualReward,
              reward_cap: tierCfg.reward_cap, reward_potential: potentialReward,
              points_left_on_table: pointsLeftOnTable, cap_utilisation: capUtil,
            }).eq('id', existingReward.id)
          }
        } else {
          await supabase.from('rewards').insert({
            user_id: userId, month: currentMonth,
            points_earned: monthlyPoints, reward_value: actualReward,
            reward_cap: tierCfg.reward_cap, reward_potential: potentialReward,
            points_left_on_table: pointsLeftOnTable, cap_utilisation: capUtil,
          })
        }
      }

      trackEvent(supabase, userId, 'day_submitted', {
        points: todayPoints, successful: daySuccessful, perfect: dayPerfect,
      })
      window.posthog?.capture('day_submitted', {
        points: todayPoints, day_successful: daySuccessful, perfect_day: dayPerfect, tier: effectiveTier,
      })

      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 1500)
      await onRefresh()
      setShowMoodCheckIn(true)
    } catch (e) { console.error('Submit failed', e) }
    finally { setSaving(false) }
  }

  const card = {
    background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  }

  const stepsLabel = stepCount >= 10000 ? `${stepCount.toLocaleString()} steps — 100 pts available`
    : stepCount >= 7500 ? `${stepCount.toLocaleString()} steps — 75 pts available`
      : stepCount >= 5000 ? `${stepCount.toLocaleString()} steps — 50 pts available`
        : stepCount > 0 ? `${stepCount.toLocaleString()} steps — need 5,000 minimum`
          : 'Enter your step count to log'
  const stepsColor = stepCount >= 5000 ? 'var(--theme-primary)' : 'var(--theme-text-muted)'
  const availableStepsPoints = calcStepsPoints(stepCount)

  // Core threshold: 2, Library threshold: 3
  const coreMetThreshold = coreCompleted >= 2
  const libraryMetThreshold = libraryCompleted >= 3

  return (
    <>
      {showCelebration && <Confetti />}
      {showPointsModal && (
        <PointsModal
          corePoints={corePoints}
          libPoints={libPoints}
          custPoints={custPoints}
          successBonus={successBonus}
          perfectBonus={perfectBonus}
          todayPoints={todayPoints}
          onClose={() => setShowPointsModal(false)}
        />
      )}

      {showMoodCheckIn && (
        <MoodCheckIn onSelect={handleMoodSelect} onSkip={handleMoodSkip} />
      )}

      {/* ── 1. Header strip (matches mobile) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: 'var(--theme-primary-light)', borderRadius: '16px',
        padding: '14px 16px', marginBottom: '16px',
        border: '1px solid rgba(74,122,104,0.3)',
      }}>
        <img src="/niyama-icon.svg" alt="Niyama" style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '17px', fontWeight: '700', color: 'var(--theme-text)', margin: 0 }}>
            Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </p>
          <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', margin: '2px 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {todayMood && <span style={{ fontSize: '24px' }}>{MOODS[todayMood - 1]}</span>}
      </div>

      {/* ── First time welcome ── */}
      {isFirstTimeUser && (
        <div style={{ ...card, background: 'var(--theme-primary)', color: 'white' }}>
          <p style={{ fontSize: '22px', marginBottom: '8px' }}>👋</p>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h2>
          <p style={{ fontSize: '14px', opacity: '0.9', lineHeight: '1.6', marginBottom: '16px' }}>
            You're all set. Today is day one of your Niyama journey. Check off your habits below and submit before midnight.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px' }}>
            {['Check off each habit you completed today', 'Tap "Submit Today" before midnight', 'Come back tomorrow and do it again'].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < 2 ? '6px' : '0' }}>
                <span style={{ opacity: '0.8', fontSize: '13px' }}>{i + 1}.</span>
                <p style={{ fontSize: '13px', opacity: '0.9', margin: 0 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 2. Streak Banner (card-based, matches mobile StreakBanner) ── */}
      {!isFirstTimeUser && (
        <div style={{
          background: 'var(--theme-card)', borderRadius: '16px',
          border: '1px solid var(--theme-border)', padding: '16px', marginBottom: '16px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Streak top row: number left, bar chart right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
              <p style={{ fontSize: '44px', fontWeight: '800', color: 'var(--theme-text)', lineHeight: 1, margin: 0 }}>
                {streak?.current_streak || 0}
              </p>
              <div style={{ paddingBottom: '6px' }}>
                <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', margin: 0 }}>
                  {(streak?.current_streak || 0) === 1 ? '🔥 day streak' : '🔥 day streak'}
                </p>
                {(streak?.current_streak || 0) >= 7 && (
                  <p style={{ fontSize: '11px', fontWeight: '600', color: '#C9973A', margin: '2px 0 0' }}>
                    {(streak?.current_streak || 0) >= 30 ? '🏆 Legendary!' : (streak?.current_streak || 0) >= 14 ? '⚡ Unstoppable!' : '🌟 Momentum!'}
                  </p>
                )}
              </div>
            </div>

            {/* 7-day bar chart */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px' }}>
              {Array.from({ length: 7 }, (_, i) => {
                const dayOffset = 6 - i
                const isToday = dayOffset === 0
                const date = new Date()
                date.setDate(date.getDate() - dayOffset)
                const dateStr = date.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
                const dayLabel = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()]
                const summary = (weekSummaries || []).find(s => s.date === dateStr)
                const BAR_MAX = 40
                let barColor, barHeight
                if (isToday) {
                  barHeight = Math.max(todayPoints > 0 ? Math.round((todayPoints / 750) * BAR_MAX) : 4, 4)
                  barColor = dayPerfect ? '#C9973A' : daySuccessful ? '#4A7A68' : '#E0E8E4'
                } else if (summary?.submitted) {
                  const pts = summary.total_points || 0
                  barHeight = Math.max(pts > 0 ? Math.round((pts / 750) * BAR_MAX) : 4, 4)
                  barColor = summary.perfect_day ? '#C9973A' : summary.day_successful ? '#4A7A68' : 'rgba(201,106,82,0.5)'
                } else {
                  barHeight = 4
                  barColor = '#E0E8E4'
                }
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{ height: `${BAR_MAX + 4}px`, display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{
                        width: '16px', height: `${barHeight}px`, borderRadius: '4px',
                        background: barColor,
                        border: isToday ? `1.5px solid #4A7A68` : 'none',
                        boxSizing: 'border-box',
                        transition: 'height 0.3s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '10px', color: isToday ? '#4A7A68' : '#8A9E96', fontWeight: isToday ? '700' : '400' }}>
                      {dayLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--theme-border)' }}>
            {[{ color: '#C9973A', label: 'Perfect' }, { color: '#4A7A68', label: 'Successful' }, { color: 'rgba(201,106,82,0.5)', label: 'Logged' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: l.color }} />
                <span style={{ fontSize: '10px', color: 'var(--theme-text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Streak freeze */}
          {(streak?.current_streak || 0) > 0 && canUseFreeze && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--theme-primary-light)', borderRadius: '10px', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', opacity: freezeUsed ? 0.4 : 1 }}>❄️</span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text)', margin: 0 }}>{freezeUsed ? 'Freeze Used' : 'Freeze Available'}</p>
                  <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', margin: 0 }}>{freezeUsed ? 'Resets 1st of month' : '1 missed day protection'}</p>
                </div>
              </div>
              {!freezeUsed && !isSubmitted && (
                <button onClick={applyStreakFreeze} style={{
                  background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)',
                  color: 'var(--theme-primary)', fontSize: '11px', fontWeight: '700', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                }}>Use ❄️</button>
              )}
            </div>
          )}
          {!canUseFreeze && (streak?.current_streak || 0) > 0 && (
            <div style={{ marginTop: '12px', background: 'var(--theme-primary-light)', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', opacity: 0.4 }}>❄️</span>
              <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', margin: 0 }}>Streak freeze available on Plus and Premium</p>
            </div>
          )}
        </div>
      )}

      {/* ── Monthly Reward Card (matches mobile hero card) ── */}
      {!isMinor && !isFreeExpired && !isFirstTimeUser && maxCap > 0 && (
        <div style={{
          background: 'var(--theme-primary)', borderRadius: '16px',
          padding: '20px', marginBottom: '16px', color: 'white',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Earned this month</p>
              <p style={{ fontSize: '36px', fontWeight: '800', lineHeight: 1, margin: 0 }}>${reward}</p>
            </div>
            <div style={{ alignItems: 'flex-end', textAlign: 'right' }}>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>of ${maxCap.toFixed(2)} cap</p>
              <div style={{ width: '100px', height: '5px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '5px', background: '#C9973A', borderRadius: '4px', width: `${capProgress}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '10px 0 0' }}>
            {monthlyPoints.toLocaleString()} pts earned this month
          </p>
        </div>
      )}

      {/* ── 3. Today's Habits ── */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--theme-text)', margin: 0 }}>Today's Habits</h2>
          <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>
            {totalCompleted}/{3 + libraryHabits.length + customHabits.length} done
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
          <span style={{ color: coreMetThreshold ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
            {coreCompleted}/3 core
          </span>
          <span style={{ color: 'var(--theme-text-muted)', fontWeight: '400' }}>·</span>
          <span style={{ color: libraryMetThreshold ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }}>
            {libraryCompleted}/7 library
          </span>
        </div>
      </div>

        {/* Core habits */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Core Habits</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {/* Wake Consistency */}
          <HabitRow
            habit={{ key: 'wake', label: 'Wake Consistency', points: 100, icon: '🌅' }}
            checked={!!habitState['wake']}
            disabled={isSubmitted}
            onToggle={(key, val) => toggleHabit(key, val, 'core')}
          />

          {/* Sleep Duration */}
          <HabitRow
            habit={{ key: 'sleep', label: 'Sleep Duration (7–9 hrs)', points: 100, icon: '🌙' }}
            checked={!!habitState['sleep']}
            disabled={isSubmitted}
            onToggle={(key, val) => toggleHabit(key, val, 'core')}
          />

          {/* Steps */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            background: habitState['steps'] ? 'var(--theme-primary-light)' : 'var(--theme-card)',
            border: `1px solid ${habitState['steps'] ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
            borderRadius: '12px', padding: '12px 16px',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                {/* Visual checkbox matching HabitRow */}
                <div style={{ position: 'relative', flexShrink: 0, marginTop: '2px' }}>
                  <input type="checkbox" checked={!!habitState['steps']}
                    onChange={e => { if (!isSubmitted) toggleHabit('steps', e.target.checked, 'core') }}
                    disabled={isSubmitted}
                    style={{ position: 'absolute', opacity: 0, width: '24px', height: '24px', cursor: isSubmitted ? 'default' : 'pointer', zIndex: 1 }} />
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: habitState['steps'] ? 'var(--theme-primary)' : 'transparent',
                    border: `1.5px solid ${habitState['steps'] ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}>
                    {habitState['steps'] && <span style={{ fontSize: '13px', color: 'white', fontWeight: '800', lineHeight: 1 }}>✓</span>}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '16px' }}>👟</span>
                    <span style={{ fontSize: '14px', fontWeight: habitState['steps'] ? '600' : '500', color: habitState['steps'] ? 'var(--theme-primary)' : 'var(--theme-text)' }}>
                      Steps or Physical Activity
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: stepsColor, margin: 0 }}>{stepsLabel}</p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {[{ label: '5,000', pts: 50, min: 5000 }, { label: '7,500', pts: 75, min: 7500 }, { label: '10,000', pts: 100, min: 10000 }].map(t => (
                      <div key={t.min} style={{ padding: '3px 8px', borderRadius: '6px', background: stepCount >= t.min ? 'var(--theme-primary)' : 'var(--theme-primary-light)', border: `1px solid ${stepCount >= t.min ? 'var(--theme-primary)' : 'var(--theme-border)'}` }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: stepCount >= t.min ? 'white' : 'var(--theme-text-muted)' }}>{t.label} · +{t.pts}</span>
                      </div>
                    ))}
                  </div>
                  {!isSubmitted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                      <input type="number" placeholder="Enter your step count..." value={stepCount || ''}
                        onChange={e => setStepCount(parseInt(e.target.value) || 0)} min="0" max="99999"
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--theme-border)', borderRadius: '8px', fontSize: '14px', color: 'var(--theme-text)', background: 'var(--theme-bg)', outline: 'none' }} />
                      <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>steps</span>
                    </div>
                  )}
                  {isSubmitted && stepCount > 0 && (
                    <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '6px' }}>{stepCount.toLocaleString()} steps logged</p>
                  )}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--theme-primary)', fontWeight: '600', flexShrink: 0, marginLeft: '8px', marginTop: '2px' }}>
                {availableStepsPoints > 0 ? `+${availableStepsPoints}` : '+0–100'}
              </span>
            </div>
          </div>
        </div>

        {/* Library habits */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', marginTop: '20px' }}>Library Habits</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: customHabits.length > 0 ? '0' : '0' }}>
          {libraryHabits.map(habit => (
            <HabitRow key={habit.key} habit={habit} checked={!!habitState[habit.key]} disabled={isSubmitted} onToggle={(key, val) => toggleHabit(key, val, 'library')} />
          ))}
        </div>

        {/* Personal habits (custom) */}
        {customHabits.length > 0 && (
          <>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', marginTop: '20px' }}>Personal Habits</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {customHabits.map((habit, idx) => (
                <HabitRow
                  key={habit.key}
                  habit={{ ...habit, icon: habit.emoji, points: customPointsPerHabit[idx] || 0 }}
                  checked={!!habitState[habit.key]}
                  disabled={isSubmitted}
                  onToggle={(key, val) => toggleHabit(key, val, 'custom')}
                />
              ))}
            </div>
          </>
        )}

        {/* Points bar — tappable for breakdown modal */}
        <div
          style={{
            marginTop: '16px', background: 'var(--theme-card)',
            border: '1px solid var(--theme-border)', borderRadius: '12px',
            padding: '14px 16px', cursor: 'pointer',
          }}
          onClick={() => setShowPointsModal(true)}
          title="Tap to see points breakdown"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>Today's Points</span>
            <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)' }}>{todayPoints} <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)', fontWeight: '400' }}>ⓘ</span></span>
          </div>
          <div style={{ background: 'var(--theme-primary-light)', borderRadius: '4px', height: '8px' }}>
            <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '8px', width: `${Math.min((todayPoints / 750) * 100, 100)}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>0</span>
            <span style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>750 max</span>
          </div>
        </div>

        {/* Successful day badge */}
        {daySuccessful && !isSubmitted && (
          <div style={{ marginTop: '16px', background: 'var(--theme-primary-light)', border: '2px solid var(--theme-primary)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '22px', marginBottom: '4px' }}>{dayPerfect ? '🏆' : '✅'}</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-primary)', margin: '0 0 4px' }}>
              {dayPerfect ? 'Perfect Day — all habits complete!' : 'Successful Day — 2+ core, 3+ library!'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', margin: 0 }}>Submit before midnight to lock it in</p>
          </div>
        )}

        {/* ── 4. Submit / Submitted ── */}
        {isSubmitted ? (
          <div style={{
            width: '100%', marginTop: '16px', background: '#C96A52',
            borderRadius: '10px', padding: '14px 14px 10px',
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            transition: 'background 0.3s ease',
          }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>
              {dayPerfect ? '🏆 Perfect Day!' : daySuccessful ? '🎉 Successful Day!' : '💪 Day Submitted'}
            </span>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
              {todayMood
                ? `Mood: ${MOODS[todayMood - 1]} · ${['Rough Day', 'Not Great', 'Okay', 'Good Day', 'Amazing'][todayMood - 1]}`
                : dayPerfect ? 'All habits completed — maximum points earned.' : daySuccessful ? 'You hit your target for today.' : 'Keep going — tomorrow is a fresh start.'}
            </span>
          </div>
        ) : (
          <button onClick={submitDay} disabled={saving || submitSuccess}
            style={{
              width: '100%', marginTop: '16px', color: 'white', fontWeight: '700',
              padding: '14px 14px 10px', borderRadius: '10px', border: 'none',
              cursor: saving || submitSuccess ? 'default' : 'pointer',
              background: submitSuccess ? '#22c55e' : saving ? 'var(--theme-text-muted)' : '#4A7A68',
              transform: submitSuccess ? 'scale(1.02)' : 'scale(1)',
              transition: 'background 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: submitSuccess ? '0 4px 15px rgba(34, 197, 94, 0.4)' : 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
            }}>
            <span style={{ fontSize: '15px' }}>
              {submitSuccess ? '✓ Day Submitted!' : saving ? 'Submitting...' : 'Submit Today'}
            </span>
            {!saving && !submitSuccess && (
              <span style={{ fontSize: '10px', opacity: '0.75', fontWeight: '500' }}>
                Once submitted, today's log is final
              </span>
            )}
          </button>
        )}
    </>
  )
}

function HabitRow({ habit, checked, disabled, onToggle }) {
  const [justChecked, setJustChecked] = useState(false)

  function handleChange(e) {
    if (disabled) return
    const newVal = e.target.checked
    if (newVal) {
      setJustChecked(true)
      setTimeout(() => setJustChecked(false), 400)
    }
    onToggle(habit.key, newVal)
  }

  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: checked ? 'var(--theme-primary-light)' : 'var(--theme-card)',
      border: `1px solid ${checked ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
      borderRadius: '12px', padding: '12px 16px',
      cursor: disabled ? 'default' : 'pointer',
      transition: 'background 0.2s ease, border-color 0.2s ease',
    }}>
      {/* Hidden real checkbox */}
      <input type="checkbox" checked={checked} onChange={handleChange} disabled={disabled}
        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
      {/* Visual checkbox */}
      <div style={{
        width: '24px', height: '24px', borderRadius: '6px', flexShrink: 0,
        background: checked ? 'var(--theme-primary)' : 'transparent',
        border: `1.5px solid ${checked ? 'var(--theme-primary)' : 'var(--theme-border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: justChecked ? 'scale(1.25)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {checked && <span style={{ fontSize: '13px', color: 'white', fontWeight: '800', lineHeight: 1 }}>✓</span>}
      </div>
      {/* Icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>{habit.icon}</span>
        <span style={{
          fontSize: '14px', fontWeight: checked ? '600' : '500',
          color: checked ? 'var(--theme-primary)' : 'var(--theme-text)',
          flex: 1, minWidth: 0, transition: 'color 0.2s',
        }}>
          {habit.label}
        </span>
        {checked && (
          <div style={{
            width: '16px', height: '16px', borderRadius: '8px',
            background: 'var(--theme-primary)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '9px', color: 'white', fontWeight: '700', lineHeight: 1 }}>✓</span>
          </div>
        )}
      </div>
      {/* Points */}
      <span style={{
        fontSize: '14px', fontWeight: checked ? '700' : '600', flexShrink: 0,
        color: checked ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
        transition: 'color 0.2s',
      }}>
        {habit.points > 0 ? `+${habit.points}` : '—'} pts
      </span>
    </label>
  )
}

export function SocialShareCard({ session, profile, streak, todaySummary, todayPoints, isMinor }) {
  const [shared, setShared] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!todaySummary?.submitted || !todaySummary?.day_successful) return null
  if (todaySummary?.social_points > 0) return null
  if (isMinor) return null

  const userId = session.user.id

  async function handleShare(platform) {
    setLoading(true)
    const text = `Day ${streak?.current_streak || 1} streak 🔥 | ${todayPoints} pts today | Niyama is rewarding my discipline daily. Join me: https://app.niyamalife.com`
    try {
      if (platform === 'share' && navigator.share) {
        await navigator.share({ title: 'My Niyama streak', text })
      } else {
        await navigator.clipboard.writeText(text)
      }
      await supabase.rpc('log_social_share', { p_user_id: userId, p_platform: platform })
      setShared(true)
    } catch (e) { console.error('Share failed', e) }
    setLoading(false)
  }

  if (shared) return (
    <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '16px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-primary)', margin: 0 }}>🎉 +20 points for sharing!</p>
      <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', marginTop: '4px' }}>Thanks for spreading the word.</p>
    </div>
  )

  return (
    <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px' }}>🔥</span>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)', margin: 0 }}>Share Your Streak — Earn 20 pts</p>
          <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', margin: 0 }}>{streak?.current_streak || 1} day streak · {todayPoints} pts today · Once per day</p>
        </div>
      </div>
      <div style={{ background: 'linear-gradient(135deg, #5A8A78, #3D6B5A)', borderRadius: '12px', padding: '16px', marginBottom: '12px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', opacity: '0.8', marginBottom: '2px', margin: 0 }}>NIYAMA</p>
            <p style={{ fontSize: '13px', fontWeight: '600', margin: 0 }}>Daily Discipline. Rewarded.</p>
          </div>
          <span style={{ fontSize: '20px' }}>🌿</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <div><p style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1, margin: 0 }}>{streak?.current_streak || 1}</p><p style={{ fontSize: '10px', opacity: '0.8', margin: 0 }}>day streak</p></div>
          <div><p style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1, margin: 0 }}>{todayPoints}</p><p style={{ fontSize: '10px', opacity: '0.8', margin: 0 }}>pts today</p></div>
          <div><p style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1, margin: 0 }}>✅</p><p style={{ fontSize: '10px', opacity: '0.8', margin: 0 }}>successful</p></div>
        </div>
        <p style={{ fontSize: '11px', opacity: '0.7', margin: 0 }}>@NiyamaLife · app.niyamalife.com</p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => handleShare('share')} disabled={loading}
          style={{ flex: 1, background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '11px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : 'Share 📤'}
        </button>
        <button onClick={() => handleShare('copy')} disabled={loading}
          style={{ flex: 1, background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)', fontWeight: '700', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
          Copy Text
        </button>
      </div>
    </div>
  )
}
