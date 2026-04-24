import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import {
  CORE_HABITS, LIBRARY_HABITS, POINTS,
  TIER_CONFIG, getEffectiveTier, getMemberMonths,
  calcReward, calcStepsPoints, isDaySuccessful, isDayPerfect,
  trackEvent, getTodayString,
} from '../../config'
import posthog from 'posthog-js'

const DEFAULT_CUSTOM_1 = { key: 'custom_1', label: 'Stretching or yoga (15+ min)', points: 50, icon: '🤸' }
const DEFAULT_CUSTOM_2 = { key: 'custom_2', label: 'Gratitude journaling', points: 50, icon: '📓' }

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

export default function HomeTab({ session, profile, streak, streakFreeze, userHabits, todayLogs, todaySummary, isMinor, today, onRefresh }) {
  const userId = session.user.id

  const buildHabitState = () => {
    const state = {}
    if (todayLogs) todayLogs.forEach(log => { state[log.habit_key] = log.completed })
    return state
  }

  const [habitState, setHabitState] = useState(buildHabitState)
  const [stepCount, setStepCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [lastTotalCompleted, setLastTotalCompleted] = useState(0)

  useEffect(() => { setHabitState(buildHabitState()) }, [todayLogs])

  // ── Tier info ──────────────────────────────────────────────────────────────
  const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const tierConfig = TIER_CONFIG[effectiveTier]
  const customSlots = tierConfig?.custom_habit_slots || 0

  // ── Build habit lists from user_habits rows ────────────────────────────────
  // user_habits is now one row per habit with habit_type + habit_key + slot_index
  const libraryRows = userHabits?.filter(h => h.habit_type === 'library' && h.is_active) || []
  const customRows = userHabits?.filter(h => h.habit_type === 'custom' && h.is_active) || []

  const libraryHabits = libraryRows.length > 0
    ? libraryRows.map(row => {
      const lib = LIBRARY_HABITS.find(h => h.key === row.habit_key)
      return lib || { key: row.habit_key, label: row.habit_label, points: 50, icon: row.habit_icon || '📌' }
    })
    : ['sunlight', 'hydration', 'meditation', 'no_late_food'].map(k => LIBRARY_HABITS.find(h => h.key === k)).filter(Boolean)

  const customHabits = []
  if (customSlots >= 1) {
    if (customRows[0]) {
      customHabits.push({ key: customRows[0].habit_key || 'custom_1', label: customRows[0].habit_label, points: 50, icon: customRows[0].habit_icon || '⭐' })
    } else {
      customHabits.push(DEFAULT_CUSTOM_1)
    }
  }
  if (customSlots >= 2) {
    if (customRows[1]) {
      customHabits.push({ key: customRows[1].habit_key || 'custom_2', label: customRows[1].habit_label, points: 50, icon: customRows[1].habit_icon || '⭐' })
    } else {
      customHabits.push(DEFAULT_CUSTOM_2)
    }
  }

  const totalHabitCount = 3 + libraryHabits.length + customHabits.length

  // ── Completion counts ──────────────────────────────────────────────────────
  const coreCompleted = CORE_HABITS.filter(h => habitState[h.key]).length
  const libraryCompleted = libraryHabits.filter(h => habitState[h.key]).length
  const customCompleted = customHabits.filter(h => habitState[h.key]).length
  const totalCompleted = coreCompleted + libraryCompleted + customCompleted
  const daySuccessful = isDaySuccessful(coreCompleted, totalCompleted)
  const dayPerfect = isDayPerfect(totalCompleted)
  const isSubmitted = !!todaySummary?.submitted
  const effectiveTierForFreeze = getEffectiveTier(profile?.tier || 'free', profile?.created_at)
  const canUseFreeze = effectiveTierForFreeze === 'plus' || effectiveTierForFreeze === 'premium'
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
      posthog.capture('streak_freeze_used', { streak_saved: streak?.current_streak || 0 })
      await onRefresh()
    } catch (e) { console.error('Freeze failed', e) }
  }

  // ── Live points ────────────────────────────────────────────────────────────
  const stepsPoints = calcStepsPoints(stepCount)
  const wakePoints = habitState['wake'] ? 100 : 0
  const phonePoints = habitState['no_phone'] ? 100 : 0
  const stepsChecked = !!habitState['steps']
  const corePoints = wakePoints + phonePoints + (stepsChecked ? stepsPoints : 0)
  const libPoints = libraryCompleted * POINTS.library_habit
  const custPoints = customCompleted * POINTS.library_habit
  const successBonus = daySuccessful ? POINTS.successful_day : 0
  const perfectBonus = dayPerfect ? POINTS.perfect_day : 0
  const todayPoints = Math.min(corePoints + libPoints + custPoints + successBonus + perfectBonus, POINTS.daily_max)

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
  const reward = isMinor ? '0.00' : calcReward(
    profile?.monthly_points || 0, effectiveTier,
    successfulDays, isSuccessfulMonth, isPerfectMonth,
    profile?.consecutive_inactive_days || 0
  )
  const tierCap = tierConfig?.max_cap || tierConfig?.reward_cap || 0
  const remaining = Math.max(tierCap - parseFloat(reward), 0).toFixed(2)
  const isFirstTimeUser = (profile?.total_days_logged || 0) === 0 && !isSubmitted

  // ── Celebration ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (daySuccessful && lastTotalCompleted < 5 && !isSubmitted) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3500)
    }
    setLastTotalCompleted(totalCompleted)
  }, [totalCompleted])

  // ── Toggle habit (auto-save to habit_logs) ────────────────────────────────
  async function toggleHabit(habitKey, checked) {
    if (isSubmitted) return
    setHabitState(prev => ({ ...prev, [habitKey]: checked }))
    try {
      const isCore = CORE_HABITS.find(h => h.key === habitKey)
      const isCustom = habitKey.startsWith('custom')
      const habitType = isCore ? 'core' : isCustom ? 'custom' : 'library'
      const pts = checked ? (isCore ? (habitKey === 'steps' ? stepsPoints : 100) : 50) : 0
      const habitLabel = isCore
        ? CORE_HABITS.find(h => h.key === habitKey)?.label
        : isCustom
          ? customHabits.find(h => h.key === habitKey)?.label
          : libraryHabits.find(h => h.key === habitKey)?.label

      await supabase.from('habit_logs').upsert({
        user_id: userId,
        date: today,
        habit_key: habitKey,
        habit_type: habitType,
        habit_label: habitLabel || habitKey,
        completed: checked,
        points_earned: checked ? pts : 0,
      }, { onConflict: 'user_id,date,habit_key' })
      posthog.capture('habit_logged', { habit_key: habitKey, habit_type: habitType, completed: checked })
    } catch (e) { console.error('Auto-save failed', e) }
  }

  // ── Steps input ───────────────────────────────────────────────────────────
  function handleStepsInput(val) {
    setStepCount(parseInt(val) || 0)
  }

  // ── Submit day ────────────────────────────────────────────────────────────
  async function submitDay() {
    if (isSubmitted || saving) return
    setSaving(true)
    try {
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Calculate per-type points
      const corePointsTotal = wakePoints + phonePoints + (stepsChecked ? stepsPoints : 0)
      const libraryPointsTotal = libraryCompleted * POINTS.library_habit
      const customPointsTotal = customCompleted * POINTS.library_habit
      const bonusSuccessful = daySuccessful ? POINTS.successful_day : 0
      const bonusPerfect = dayPerfect ? POINTS.perfect_day : 0

      const summaryPayload = {
        user_id: userId,
        date: today,                          // correct column name
        core_total: CORE_HABITS.length,
        core_completed: coreCompleted,
        library_total: libraryHabits.length,
        library_completed: libraryCompleted,
        custom_total: customHabits.length,
        custom_completed: customCompleted,
        total_habits: totalHabitCount,
        total_completed: totalCompleted,
        day_successful: daySuccessful,
        perfect_day: dayPerfect,
        points_from_core: corePointsTotal,
        points_from_library: libraryPointsTotal,
        points_from_custom: customPointsTotal,
        bonus_successful_day: bonusSuccessful,
        bonus_perfect_day: bonusPerfect,
        total_points: todayPoints,            // correct column name
        submitted: true,
        submitted_at: now.toISOString(),
      }

      // Check for existing summary
      const { data: existingSummary } = await supabase
        .from('daily_summaries').select('id')
        .eq('user_id', userId).eq('date', today).maybeSingle()

      if (existingSummary) {
        await supabase.from('daily_summaries').update(summaryPayload).eq('id', existingSummary.id)
      } else {
        await supabase.from('daily_summaries').insert(summaryPayload)
      }

      // Recalculate monthly points
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      const { data: monthSummaries } = await supabase
        .from('daily_summaries').select('total_points, day_successful')
        .eq('user_id', userId).gte('date', monthStart)

      const monthlyPoints = monthSummaries?.reduce((s, r) => s + (r.total_points || 0), 0) || 0
      const successfulDaysNew = monthSummaries?.filter(r => r.day_successful).length || 0

      // Update streak
      let newStreak = streak?.current_streak || 0
      let newLongest = streak?.longest_streak || 0
      if (daySuccessful) { newStreak += 1; if (newStreak > newLongest) newLongest = newStreak }
      else newStreak = 0
      await supabase.from('streaks').update({
        current_streak: newStreak, longest_streak: newLongest,
        updated_at: now.toISOString(),
      }).eq('user_id', userId)

      // Update profile
      const { data: allSummaries } = await supabase
        .from('daily_summaries').select('day_successful').eq('user_id', userId)
      const overallSuccessful = allSummaries?.filter(r => r.day_successful).length || 0
      const totalDaysLogged = allSummaries?.length || 0
      const isFirstEver = totalDaysLogged === 1

      await supabase.from('profiles').update({
        monthly_points: monthlyPoints,
        successful_days: successfulDaysNew,
        consecutive_inactive_days: 0,
        last_active_date: today,
        overall_successful_days: overallSuccessful,
        total_days_logged: totalDaysLogged,
        ...(isFirstEver && { first_submission_date: today }),
      }).eq('id', userId)

      // Upsert rewards row
      const tierCfg = TIER_CONFIG[effectiveTier]
      if (tierCfg && tierCfg.reward_cap > 0) {
        const potentialReward = monthlyPoints / 1000
        const actualReward = isEligible ? Math.min(potentialReward, tierCfg.reward_cap) : 0
        const pointsLeftOnTable = Math.max(potentialReward - tierCfg.reward_cap, 0)
        const capUtil = Math.min(Math.round((potentialReward / tierCfg.reward_cap) * 100), 100)
        const { data: existingReward } = await supabase
          .from('rewards').select('id, manual_override')
          .eq('user_id', userId).eq('month', currentMonth).maybeSingle()
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

      trackEvent(supabase, userId, 'habit_submitted', {
        points: todayPoints, day_successful: daySuccessful, perfect_day: dayPerfect,
        core_completed: coreCompleted, library_completed: libraryCompleted,
        custom_completed: customCompleted, hour: now.getHours(),
      })
      posthog.capture('day_submitted', {
        points: todayPoints, day_successful: daySuccessful, perfect_day: dayPerfect,
        core_completed: coreCompleted, library_completed: libraryCompleted,
        custom_completed: customCompleted, total_completed: totalCompleted,
        tier: effectiveTier,
      })
      await onRefresh()
    } catch (e) { console.error('Submit failed', e) }
    finally { setSaving(false) }
  }

  const card = {
    background: 'var(--theme-card)', border: '1px solid var(--theme-border)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px',
  }

  const stepsLabel = stepCount >= 10000 ? `${stepCount.toLocaleString()} steps — 100 pts available`
    : stepCount >= 7500 ? `${stepCount.toLocaleString()} steps — 75 pts available`
      : stepCount >= 5000 ? `${stepCount.toLocaleString()} steps — 50 pts available`
        : stepCount > 0 ? `${stepCount.toLocaleString()} steps — need 5,000 minimum`
          : 'Enter steps, then tick to log'
  const stepsColor = stepCount >= 5000 ? 'var(--theme-primary)' : 'var(--theme-text-muted)'
  const availableStepsPoints = calcStepsPoints(stepCount)

  return (
    <>
      {showCelebration && <Confetti />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--theme-text)' }}>Niyama Life</h1>
          <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginTop: '2px' }}>
            Hey, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </p>
        </div>
        <span style={{ background: 'var(--theme-primary)', color: 'white', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px', textTransform: 'capitalize' }}>
          {tierConfig?.label || 'Free'}
        </span>
      </div>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '12px', fontWeight: '500', padding: '4px 12px', borderRadius: '20px' }}>
          Beta testing version
        </span>
      </div>

      {/* Banners */}
      {isFreeTrial && !isFirstTimeUser && (
        <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '12px', padding: '12px 14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-primary)', marginBottom: '2px' }}>
            🎁 Free trial — {trialMonthsLeft} month{trialMonthsLeft !== 1 ? 's' : ''} remaining
          </p>
          <p style={{ fontSize: '11px', color: 'var(--theme-text-secondary)' }}>Earn up to $2.50/mo · Upgrades to Basic after month 3</p>
        </div>
      )}
      {isFreeExpired && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '4px' }}>Your free reward period has ended</p>
          <p style={{ fontSize: '12px', color: '#78350f', marginBottom: '10px', lineHeight: '1.5' }}>Upgrade to Basic for $0.99/month to continue earning rewards.</p>
          <div style={{ background: 'var(--theme-primary)', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'white' }}>Basic — $0.99/month</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>Up to $5.00/mo →</span>
          </div>
        </div>
      )}

      {/* First time welcome */}
      {isFirstTimeUser && (
        <div style={{ ...card, background: 'var(--theme-primary)', color: 'white' }}>
          <p style={{ fontSize: '22px', marginBottom: '8px' }}>👋</p>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Welcome, {profile?.full_name?.split(' ')[0] || 'there'}!</h2>
          <p style={{ fontSize: '14px', opacity: '0.9', lineHeight: '1.6', marginBottom: '16px' }}>
            You're all set. Today is day one of your Niyama journey. Check off your habits below and submit before midnight.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '10px', padding: '12px' }}>
            {['Check off each habit you completed today', 'Tap "Submit today" before midnight', 'Come back tomorrow and do it again'].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: i < 2 ? '6px' : '0' }}>
                <span style={{ opacity: '0.8', fontSize: '13px' }}>{i + 1}.</span>
                <p style={{ fontSize: '13px', opacity: '0.9' }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Streak banner */}
      {!isFirstTimeUser && (
        <div style={{ ...card, background: 'var(--theme-primary)', color: 'white', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: (streak?.current_streak || 0) >= 25 ? '48px' : (streak?.current_streak || 0) >= 10 ? '40px' : (streak?.current_streak || 0) >= 5 ? '34px' : '28px',
                animation: (streak?.current_streak || 0) > 0 ? 'flame-pulse 1.5s ease-in-out infinite' : 'none', lineHeight: 1,
              }}>🔥</span>
              <div>
                <p style={{ fontSize: '13px', opacity: '0.8', marginBottom: '2px' }}>Current streak</p>
                <p style={{ fontSize: '32px', fontWeight: '700', lineHeight: 1 }}>
                  {streak?.current_streak || 0} <span style={{ fontSize: '16px', opacity: '0.8' }}>days</span>
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '12px', opacity: '0.7' }}>Longest</p>
              <p style={{ fontSize: '18px', fontWeight: '700', marginTop: '2px' }}>{streak?.longest_streak || 0}</p>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '11px', opacity: '0.7', marginBottom: '8px' }}>Last 7 days</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {Array.from({ length: 7 }, (_, i) => {
                const dayOffset = 6 - i, isToday = dayOffset === 0, wasSuccess = dayOffset < (streak?.current_streak || 0)
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '100%', aspectRatio: '1', borderRadius: '50%',
                      background: isToday ? (daySuccessful ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)') : (wasSuccess ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)'),
                      border: isToday ? '2px solid rgba(255,255,255,0.8)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {(wasSuccess || (isToday && daySuccessful)) && <span style={{ fontSize: '10px' }}>✓</span>}
                    </div>
                    <p style={{ fontSize: '9px', opacity: '0.7' }}>
                      {isToday ? 'Today' : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(new Date().getDay() + 6 - dayOffset) % 7]}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Streak freeze button */}
          {(streak?.current_streak || 0) > 0 && canUseFreeze && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px', opacity: freezeUsed ? 0.4 : 1, filter: freezeUsed ? 'grayscale(1)' : 'none' }}>❄️</span>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>
                    {freezeUsed ? 'Streak freeze used' : 'Streak freeze available'}
                  </p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>
                    {freezeUsed ? 'Resets 1st of next month' : 'Protects your streak for 1 missed day'}
                  </p>
                </div>
              </div>
              {!freezeUsed && !isSubmitted && (
                <button onClick={applyStreakFreeze}
                  style={{ background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.5)', color: 'white', fontSize: '11px', fontWeight: '700', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}>
                  Use freeze
                </button>
              )}
            </div>
          )}
          {!canUseFreeze && (streak?.current_streak || 0) > 0 && (
            <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', opacity: 0.5 }}>❄️</span>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Streak freeze — available on Plus and Premium</p>
            </div>
          )}

          {(streak?.current_streak || 0) >= 10 && (
            <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', opacity: '0.9' }}>
                {(streak?.current_streak || 0) >= 25 ? '🏆 25 days strong!' : `🌟 ${streak?.current_streak} day streak! You're on fire!`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Habits card */}
      <div style={card}>
        <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '4px' }}>Today's habits</h2>
        <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '4px' }}>{totalCompleted}/{totalHabitCount} completed · {todayPoints} pts</p>
        <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '20px' }}>
          Complete 5 of {totalHabitCount} habits (at least 2 core) for a successful day
        </p>

        {/* Core habits */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Core habits</p>
        <div style={{ background: 'var(--theme-primary-light)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>🏥</span>
          <p style={{ fontSize: '11px', color: 'var(--theme-primary)', lineHeight: '1.5' }}>
            Core habits will be <strong>auto-verified via Apple Health / Google Fit</strong> in the native app. Log manually for now.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <HabitRow habit={{ key: 'wake', label: 'Wake before 7:30 AM', points: 100, icon: '🌅' }} checked={!!habitState['wake']} disabled={isSubmitted} onToggle={toggleHabit} />
          <HabitRow habit={{ key: 'no_phone', label: 'No phone after 10:30 PM', points: 100, icon: '📵' }} checked={!!habitState['no_phone']} disabled={isSubmitted} onToggle={toggleHabit} />

          {/* Steps */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                <input type="checkbox" checked={!!habitState['steps']} onChange={e => { if (!isSubmitted) toggleHabit('steps', e.target.checked) }} disabled={isSubmitted}
                  style={{ width: '18px', height: '18px', marginTop: '2px', cursor: isSubmitted ? 'default' : 'pointer', accentColor: 'var(--theme-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px' }}>👟</span>
                    <span style={{ fontSize: '14px', color: habitState['steps'] ? 'var(--theme-text)' : 'var(--theme-text-secondary)' }}>Steps / physical activity</span>
                  </div>
                  <p style={{ fontSize: '11px', color: stepsColor }}>{stepsLabel}</p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {[{ label: '5,000', pts: 50, min: 5000 }, { label: '7,500', pts: 75, min: 7500 }, { label: '10,000', pts: 100, min: 10000 }].map(t => (
                      <div key={t.min} style={{ padding: '3px 8px', borderRadius: '6px', background: stepCount >= t.min ? 'var(--theme-primary)' : 'var(--theme-primary-light)', border: `1px solid ${stepCount >= t.min ? 'var(--theme-primary)' : 'var(--theme-border)'}` }}>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: stepCount >= t.min ? 'white' : 'var(--theme-text-muted)' }}>{t.label} · +{t.pts}</span>
                      </div>
                    ))}
                  </div>
                  {!isSubmitted && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                      <input type="number" placeholder="Enter your step count..." value={stepCount || ''} onChange={e => handleStepsInput(e.target.value)} min="0" max="99999"
                        style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--theme-border)', borderRadius: '8px', fontSize: '14px', color: 'var(--theme-text)', background: 'var(--theme-bg)', outline: 'none' }} />
                      <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)', whiteSpace: 'nowrap' }}>steps</span>
                    </div>
                  )}
                  {isSubmitted && stepCount > 0 && <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '6px' }}>{stepCount.toLocaleString()} steps logged</p>}
                </div>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--theme-primary)', fontWeight: '600', flexShrink: 0, marginLeft: '8px', marginTop: '2px' }}>
                {availableStepsPoints > 0 ? `+${availableStepsPoints}` : '+0–100'}
              </span>
            </div>
          </div>
        </div>

        {/* Library habits */}
        <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Your habits</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: customHabits.length > 0 ? '24px' : '0' }}>
          {libraryHabits.map(habit => (
            <HabitRow key={habit.key} habit={habit} checked={!!habitState[habit.key]} disabled={isSubmitted} onToggle={toggleHabit} />
          ))}
        </div>

        {/* Custom habits */}
        {customHabits.length > 0 && (
          <>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--theme-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '12px' }}>Custom habits</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customHabits.map(habit => (
                <HabitRow key={habit.key} habit={habit} checked={!!habitState[habit.key]} disabled={isSubmitted} onToggle={toggleHabit} />
              ))}
            </div>
          </>
        )}

        {/* Points bar */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--theme-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>Today's points</span>
            <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)' }}>{todayPoints}</span>
          </div>
          <div style={{ background: 'var(--theme-primary-light)', borderRadius: '4px', height: '8px' }}>
            <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '8px', width: `${(todayPoints / POINTS.daily_max) * 100}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>0</span>
            <span style={{ fontSize: '11px', color: 'var(--theme-text-muted)' }}>{POINTS.daily_max} max</span>
          </div>
        </div>

        {/* Successful day badge */}
        {daySuccessful && !isSubmitted && (
          <div style={{ marginTop: '16px', background: 'var(--theme-primary-light)', border: '2px solid var(--theme-primary)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '22px', marginBottom: '4px' }}>{dayPerfect ? '🏆' : '✅'}</p>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'var(--theme-primary)' }}>
              {dayPerfect ? `Perfect day — all ${totalHabitCount} habits!` : 'Successful day — 5+ habits with 2+ core!'}
            </p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', marginTop: '4px' }}>Submit before midnight to lock it in</p>
          </div>
        )}

        {/* Submit */}
        {isSubmitted ? (
          <div style={{ marginTop: '16px', background: 'var(--theme-primary-light)', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: 'var(--theme-primary)' }}>✓ Submitted for today</p>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '4px' }}>
              {dayPerfect ? 'Perfect day! 🏆' : daySuccessful ? 'Successful day! 🎉' : 'Keep going tomorrow 💪'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ borderLeft: '4px solid var(--theme-primary)', background: 'var(--theme-primary-light)', borderRadius: '0 8px 8px 0', padding: '10px 12px', marginTop: '16px' }}>
              <p style={{ fontSize: '12px', color: 'var(--theme-text)', lineHeight: '1.5' }}>✏️ <strong>Heads up!</strong> Once submitted, today's log is final.</p>
            </div>
            <button onClick={submitDay} disabled={saving}
              style={{ width: '100%', marginTop: '12px', background: 'var(--theme-secondary)', color: 'white', fontWeight: '600', padding: '14px', borderRadius: '10px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '15px', border: 'none', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Submitting...' : 'Submit today'}
            </button>
          </>
        )}
      </div>

      {/* Social sharing */}
      <SocialShareCard
        session={session}
        profile={profile}
        streak={streak}
        todaySummary={todaySummary}
        todayPoints={todayPoints}
      />

      {/* Reward eligibility */}
      <div style={card}>
        {isFreeExpired ? (
          <div>
            <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', marginBottom: '8px' }}>Reward eligibility</p>
            <div style={{ background: '#fffbeb', borderRadius: '8px', padding: '10px 12px' }}>
              <p style={{ fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>Upgrade to Basic or above to qualify for monthly rewards.</p>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)' }}>Progress to reward eligibility</p>
              <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-primary)' }}>{successfulDays}/{minDays}</p>
            </div>
            <div style={{ background: 'var(--theme-primary-light)', borderRadius: '4px', height: '8px' }}>
              <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '8px', width: `${minDays > 0 ? Math.min(successfulDays / minDays * 100, 100) : 0}%`, transition: 'width 0.3s' }} />
            </div>
            {isEligible
              ? <p style={{ fontSize: '12px', color: 'var(--theme-primary)', marginTop: '8px' }}>✓ Eligible for rewards this month 🎉</p>
              : <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '6px' }}>{minDays - successfulDays} more successful {minDays - successfulDays === 1 ? 'day' : 'days'} needed</p>
            }
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'Monthly points', value: profile?.monthly_points || 0, sub: 'max 22,500' },
          { label: 'Successful days', value: successfulDays, sub: 'this month' },
          { label: 'Overall successful', value: profile?.overall_successful_days || 0, sub: 'all time' },
          { label: 'Days logged', value: profile?.total_days_logged || 0, sub: 'all time' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '16px' }}>
            <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', marginBottom: '4px' }}>{stat.label}</p>
            {isFirstTimeUser
              ? <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', fontStyle: 'italic', lineHeight: '1.5' }}>Submit your first day to see this</p>
              : <><p style={{ fontSize: '26px', fontWeight: '700', color: 'var(--theme-text)' }}>{stat.value}</p><p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginTop: '2px' }}>{stat.sub}</p></>
            }
          </div>
        ))}
      </div>

      {/* Rewards summary */}
      <div style={card}>
        <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '16px' }}>Rewards</h2>
        {isFreeExpired ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>Points this month</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>{profile?.monthly_points || 0}</span>
            </div>
            <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '14px' }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>Free trial ended</p>
              <p style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.6', marginBottom: '10px' }}>
                {(profile?.monthly_points || 0) > 0 ? `You would have earned $${((profile?.monthly_points || 0) / 1000).toFixed(2)} this month. Upgrade to keep earning.` : 'Upgrade to Basic for $0.99/month and start earning rewards.'}
              </p>
              <div style={{ background: 'var(--theme-primary)', borderRadius: '8px', padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: '500', color: 'white' }}>Basic — $0.99/month</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>Up to $5.00/mo →</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
              {[
                { label: 'Estimated reward', value: `$${reward}`, color: 'var(--theme-primary)' },
                { label: 'Reward cap', value: `$${typeof tierCap === 'number' ? tierCap.toFixed(2) : tierCap}`, color: 'var(--theme-text)' },
                { label: 'Remaining cap', value: `$${remaining}`, color: 'var(--theme-text)' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>{item.label}</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            {isMinor && <div style={{ background: 'var(--theme-primary-light)', borderRadius: '8px', padding: '10px' }}><p style={{ fontSize: '13px', textAlign: 'center', color: 'var(--theme-primary)' }}>Rewards available when you turn 18</p></div>}
            {!isMinor && isInactive && <div style={{ background: '#fef2f2', borderRadius: '8px', padding: '10px' }}><p style={{ fontSize: '13px', textAlign: 'center', color: '#dc2626' }}>⚠️ Ineligible — 5+ consecutive inactive days</p></div>}
            {!isMinor && isFreeTrial && (
              <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '10px', padding: '12px' }}>
                <p style={{ fontSize: '12px', color: 'var(--theme-primary)', lineHeight: '1.6' }}>🎁 <strong>{trialMonthsLeft} month{trialMonthsLeft !== 1 ? 's' : ''} left</strong> in your free trial.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function HabitRow({ habit, checked, disabled, onToggle }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: disabled ? 'default' : 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input type="checkbox" checked={checked} onChange={e => { if (!disabled) onToggle(habit.key, e.target.checked) }} disabled={disabled}
          style={{ width: '18px', height: '18px', cursor: disabled ? 'default' : 'pointer', accentColor: 'var(--theme-primary)', flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>{habit.icon}</span>
          <span style={{ fontSize: '14px', color: checked ? 'var(--theme-text)' : 'var(--theme-text-secondary)' }}>{habit.label}</span>
        </div>
      </div>
      <span style={{ fontSize: '12px', color: 'var(--theme-primary)', fontWeight: '600', flexShrink: 0, marginLeft: '8px' }}>+{habit.points}</span>
    </label>
  )
}
// ─── Social Share Card ────────────────────────────────────────────────────────
export function SocialShareCard({ session, profile, streak, todaySummary, todayPoints }) {
  const [shared, setShared] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!todaySummary?.submitted || !todaySummary?.day_successful) return null
  if (todaySummary?.social_points > 0) return null // already shared today

  const userId = session.user.id

  async function handleShare(platform) {
    setLoading(true)
    const text = `Day ${streak?.current_streak || 1} streak 🔥 | ${todayPoints} pts today | Niyama Life is rewarding my discipline daily. Join me: https://app.niyamalife.com`
    try {
      if (platform === 'share' && navigator.share) {
        await navigator.share({ title: 'My Niyama streak', text })
      } else {
        await navigator.clipboard.writeText(text)
      }
      // Award points via RPC
      await supabase.rpc('log_social_share', { p_user_id: userId, p_platform: platform })
      setShared(true)
    } catch (e) { console.error('Share failed', e) }
    setLoading(false)
  }

  if (shared) return (
    <div style={{ background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', borderRadius: '16px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-primary)' }}>🎉 +20 points for sharing!</p>
      <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', marginTop: '4px' }}>Thanks for spreading the word.</p>
    </div>
  )

  return (
    <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '24px' }}>🔥</span>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--theme-text)' }}>Share your streak — earn 20 pts</p>
          <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>{streak?.current_streak || 1} day streak · {todayPoints} pts today · Once per day</p>
        </div>
      </div>

      {/* Branded card preview */}
      <div style={{ background: 'linear-gradient(135deg, #5A8A78, #3D6B5A)', borderRadius: '12px', padding: '16px', marginBottom: '12px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', opacity: '0.8', marginBottom: '2px' }}>NIYAMA LIFE</p>
            <p style={{ fontSize: '13px', fontWeight: '600' }}>Daily Discipline. Rewarded.</p>
          </div>
          <span style={{ fontSize: '20px' }}>🌿</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1 }}>{streak?.current_streak || 1}</p>
            <p style={{ fontSize: '10px', opacity: '0.8' }}>day streak</p>
          </div>
          <div>
            <p style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1 }}>{todayPoints}</p>
            <p style={{ fontSize: '10px', opacity: '0.8' }}>pts today</p>
          </div>
          <div>
            <p style={{ fontSize: '28px', fontWeight: '800', lineHeight: 1 }}>✅</p>
            <p style={{ fontSize: '10px', opacity: '0.8' }}>successful</p>
          </div>
        </div>
        <p style={{ fontSize: '11px', opacity: '0.7' }}>@NiyamaLife · app.niyamalife.com</p>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={() => handleShare('share')} disabled={loading}
          style={{ flex: 1, background: 'var(--theme-primary)', color: 'white', fontWeight: '700', padding: '11px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', opacity: loading ? 0.7 : 1 }}>
          {loading ? '...' : 'Share 📤'}
        </button>
        <button onClick={() => handleShare('copy')} disabled={loading}
          style={{ flex: 1, background: 'var(--theme-primary-light)', border: '1px solid var(--theme-primary)', color: 'var(--theme-primary)', fontWeight: '700', padding: '11px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
          Copy text
        </button>
      </div>
      <p style={{ fontSize: '10px', color: 'var(--theme-text-muted)', textAlign: 'center', marginTop: '8px' }}>
        Tap "I shared this" after posting to earn your 20 points
      </p>
    </div >
  )
}