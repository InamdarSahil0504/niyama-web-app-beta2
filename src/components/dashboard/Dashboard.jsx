import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { applyTheme, getEffectiveTier, getTodayString, trackEvent, TIER_CONFIG } from '../../config'

// Onboarding screens
import FounderStory from '../onboarding/FounderStory'
import RulesPage from '../onboarding/RulesPage'
import PersonalDetails from '../onboarding/PersonalDetails'
import HealthPermission from '../onboarding/HealthPermission'
import TierSelect from '../onboarding/TierSelect'
import WakeTime from '../onboarding/WakeTime'
import MovementPreference from '../onboarding/MovementPreference'
import HabitSelect from '../onboarding/HabitSelect'
import CustomHabits from '../onboarding/CustomHabits'
import NotificationsSetup from '../onboarding/NotificationsSetup'
import OnboardingReady from '../onboarding/OnboardingReady'

// Dashboard tabs
import HomeTab from './HomeTab'
import AnalyticsTab from './AnalyticsTab'
import RewardsTab from './RewardsTab'
import SettingsTab from './SettingsTab'
import BottomNav from './BottomNav'
import ReferralTab from './ReferralTab'

// Onboarding steps in order
const STEPS = [
  'founder-story',      // 1
  'rules',              // 2 (rules page = screen 3 in spec, but kept as pre-signup context)
  'personal-details',   // 3
  'health-permission',  // 4
  'tier-select',        // 5
  'wake-time',          // 6
  'movement',           // 7
  'habit-select',       // 8
  'custom-habits',      // 9
  'notifications',      // 10
  'ready',              // 11
]

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [streak, setStreak] = useState(null)
  const [userHabits, setUserHabits] = useState(null)
  const [todaySummary, setTodaySummary] = useState(null)
  const [todayLogs, setTodayLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [onboardingStep, setOnboardingStep] = useState(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isMinor, setIsMinor] = useState(false)
  const [streakFreeze, setStreakFreeze] = useState(null)
  const [persistedHabitState, setPersistedHabitState] = useState({})

  // Onboarding collected data — passed forward through screens
  const [onboardingData, setOnboardingData] = useState({
    wakeMinutes: 450,         // default 7:30am
    movementPreference: 'steps',
    libraryKeys: [],
    customHabits: [],
    notificationPrefs: {},
  })

  const today = getTodayString()
  const userId = session.user.id

  useEffect(() => {
    // Check for Stripe/redirect returns BEFORE fetching data
    const params = new URLSearchParams(window.location.search)

    if (params.get('onboarding') === 'continue') {
      window.history.replaceState({}, '', window.location.pathname)
      localStorage.removeItem('niyama_onboarding_pending')
      localStorage.removeItem('niyama_onboarding_step')
      // Will be set after fetchData completes
      localStorage.setItem('niyama_restore_step', 'wake-time')
    }

    if (params.get('onboarding') === 'tier') {
      window.history.replaceState({}, '', window.location.pathname)
      localStorage.removeItem('niyama_onboarding_pending')
      localStorage.setItem('niyama_restore_step', 'tier-select')
    }

    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    // 1. Load profile
    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle()

    if (profileData) {
      if (profileData.color_theme) applyTheme(profileData.color_theme)
      if (profileData.is_minor) setIsMinor(true)

      // Sync timezone + email
      const updates = {}
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz && profileData.timezone !== tz) updates.timezone = tz
      if (session.user.email && profileData.email !== session.user.email) updates.email = session.user.email
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', userId)
      }

      // Month rollover
      const now = new Date()
      if (profileData.last_active_date) {
        const lastActive = new Date(profileData.last_active_date)
        if (now.getMonth() !== lastActive.getMonth() || now.getFullYear() !== lastActive.getFullYear()) {
          await supabase.from('profiles').update({
            monthly_points: 0,
            successful_days: 0,
            consecutive_inactive_days: 0,
          }).eq('id', userId)
        }
      }
    }
    // Auto-submit yesterday if habits logged but not submitted
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })

    const { data: yesterdaySummary } = await supabase
      .from('daily_summaries').select('*')
      .eq('user_id', userId).eq('date', yesterdayStr).maybeSingle()

    const { data: yesterdayLogs } = await supabase
      .from('habit_logs').select('*')
      .eq('user_id', userId).eq('date', yesterdayStr)

    if (yesterdayLogs && yesterdayLogs.length > 0 && !yesterdaySummary?.submitted) {
      // Has logs but not submitted — auto-submit
      const coreKeys = ['wake', 'no_phone', 'steps']
      const coreCompleted = yesterdayLogs.filter(l => coreKeys.includes(l.habit_key) && l.completed).length
      const totalCompleted = yesterdayLogs.filter(l => l.completed).length
      const daySuccessful = totalCompleted >= 5 && coreCompleted >= 2
      const dayPerfect = totalCompleted >= 9
      const totalPoints = yesterdayLogs.reduce((s, l) => s + (l.points_earned || 0), 0)

      const autoPayload = {
        user_id: userId, date: yesterdayStr,
        core_completed: coreCompleted,
        library_completed: yesterdayLogs.filter(l => l.habit_type === 'library' && l.completed).length,
        custom_completed: yesterdayLogs.filter(l => l.habit_type === 'custom' && l.completed).length,
        total_completed: totalCompleted,
        total_habits: 9,
        day_successful: daySuccessful,
        perfect_day: dayPerfect,
        total_points: Math.min(totalPoints, 750),
        submitted: true,
        auto_submitted: true,
        submitted_at: new Date().toISOString(),
      }

      if (yesterdaySummary) {
        await supabase.from('daily_summaries').update(autoPayload).eq('id', yesterdaySummary.id)
      } else {
        await supabase.from('daily_summaries').insert(autoPayload)
      }
    } else if (!yesterdaySummary && (!yesterdayLogs || yesterdayLogs.length === 0)) {
      // Nothing logged — mark as inactive
      await supabase.from('daily_summaries').upsert({
        user_id: userId, date: yesterdayStr,
        core_completed: 0, library_completed: 0, custom_completed: 0,
        total_completed: 0, total_habits: 9,
        day_successful: false, perfect_day: false,
        total_points: 0,
        submitted: true, auto_submitted: true,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })
      // Increment consecutive inactive days
      await supabase.from('profiles').update({
        consecutive_inactive_days: (profileData?.consecutive_inactive_days || 0) + 1
      }).eq('id', userId)
    }

    // 2. Reload profile
    const { data: updatedProfile } = await supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(updatedProfile)

    if (updatedProfile?.deleted_at) {
      await supabase.auth.signOut()
      return
    }

    if (!updatedProfile) {
      await supabase.from('profiles').insert({
        id: userId,
        email: session.user.email,
        tier: 'free',
        monthly_points: 0,
        onboarding_complete: false,
      })
      await supabase.from('streaks').insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
      })
      await fetchData()
      return
    }
    if (updatedProfile) {
      if (!updatedProfile.onboarding_complete) {
        const restoreStep = localStorage.getItem('niyama_restore_step')
        if (restoreStep) {
          localStorage.removeItem('niyama_restore_step')
          setOnboardingStep(restoreStep)
        } else {
          setOnboardingStep('founder-story')
        }
        setLoading(false)
        return
      }
    }

    // 3. Load streak
    const { data: streakData } = await supabase
      .from('streaks').select('*').eq('user_id', userId).single()
    setStreak(streakData)

    // 3b. Load streak freeze status
    const now2 = new Date()
    const currentMonth2 = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`
    const { data: freezeData } = await supabase
      .from('streak_freezes')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${currentMonth2}-01`)
      .maybeSingle()
    setStreakFreeze(freezeData || null)

    // 4. Load habit selection (one row per habit)
    const { data: userHabitData } = await supabase
      .from('user_habits').select('*').eq('user_id', userId).eq('is_active', true)
    setUserHabits(userHabitData || [])

    // 5. Load today's logs
    const { data: logsData } = await supabase
      .from('habit_logs').select('*').eq('user_id', userId).eq('date', today)
    setTodayLogs(logsData || [])

    // 6. Load today's summary
    const { data: summaryData } = await supabase
      .from('daily_summaries').select('*')
      .eq('user_id', userId).eq('date', today).maybeSingle()
    setTodaySummary(summaryData)

    setLoading(false)
  }

  // ── Onboarding step navigation ─────────────────────────────────────────────
  function nextStep(currentStep) {
    const idx = STEPS.indexOf(currentStep)
    if (idx < STEPS.length - 1) {
      setOnboardingStep(STEPS[idx + 1])
    } else {
      setOnboardingStep(null)
    }
  }

  function prevStep(currentStep) {
    const idx = STEPS.indexOf(currentStep)
    if (idx <= 0) return
    const prevStepKey = STEPS[idx - 1]
    // Can't go back past payment
    if (prevStepKey === 'tier-select' && profile?.stripe_subscription_id) return
    setOnboardingStep(prevStepKey)
  }

  // ── Save user_habits row after onboarding ──────────────────────────────────
  async function saveUserHabits(data) {
    const { libraryKeys, customHabits, wakeMinutes, movementPreference } = data

    // Build user_habits upsert
    const habitPayload = {
      user_id: userId,
      library_habit_1: libraryKeys[0] || null,
      library_habit_2: libraryKeys[1] || null,
      library_habit_3: libraryKeys[2] || null,
      library_habit_4: libraryKeys[3] || null,
      custom_habit_1_label: customHabits[0] || null,
      custom_habit_2_label: customHabits[1] || null,
      wake_time_minutes: wakeMinutes,
      movement_preference: movementPreference,
      updated_at: new Date().toISOString(),
    }

    const { data: existing } = await supabase
      .from('user_habits').select('id').eq('user_id', userId).single()

    if (existing) {
      await supabase.from('user_habits').update(habitPayload).eq('user_id', userId)
    } else {
      await supabase.from('user_habits').insert(habitPayload)
    }
  }

  // ── Complete onboarding ────────────────────────────────────────────────────
  async function completeOnboarding() {
    await saveUserHabits(onboardingData)
    await supabase.from('profiles').update({
      onboarding_complete: true,
      wake_time_minutes: onboardingData.wakeMinutes,
      habits_last_changed: new Date().toISOString(),
    }).eq('id', userId)
    trackEvent(supabase, userId, 'onboarding_completed', {
      tier: profile?.tier || 'free',
      movement: onboardingData.movementPreference,
      library_habits: onboardingData.libraryKeys,
      wake_minutes: onboardingData.wakeMinutes,
    })
    // Update local profile state directly to avoid re-triggering onboarding
    setProfile(prev => ({ ...prev, onboarding_complete: true }))
    setOnboardingStep(null)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    trackEvent(supabase, userId, 'page_visit', { page: tab })
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <img src="/niyama-icon.svg" alt="Niyama Life"
        style={{ width: '72px', height: '72px', borderRadius: '18px', animation: 'fadeIn 0.5s ease' }} />
      <div style={{ width: '24px', height: '24px', border: '3px solid var(--theme-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  // ── Onboarding flow ────────────────────────────────────────────────────────

  // Screen 1 — Founder story
  if (onboardingStep === 'founder-story')
    return <FounderStory onContinue={() => nextStep('founder-story')} />

  // Screen 2 — Rules (using RulesPage which covers the "how it works" context)
  if (onboardingStep === 'rules')
    return <RulesPage onBack={() => prevStep('rules')} onContinue={async () => {
      await supabase.from('profiles').update({ rules_acknowledged: true }).eq('id', userId)
      nextStep('rules')
    }} />

  // Screen 3 — Personal details
  if (onboardingStep === 'personal-details')
    return <PersonalDetails userId={userId} onBack={() => prevStep('personal-details')} onContinue={async (minor, theme) => {
      setIsMinor(minor)
      applyTheme(theme)
      if (minor) {
        // Minors skip tier select — set free tier automatically
        await supabase.from('profiles').update({ tier: 'free', tier_chosen: true }).eq('id', userId)
        setProfile(prev => ({ ...prev, tier: 'free', tier_chosen: true, is_minor: true }))
        // Skip health-permission and tier-select, go straight to wake-time
        setOnboardingStep('health-permission')
      } else {
        nextStep('personal-details')
      }
    }} />

  // Screen 4 — Health permission
  if (onboardingStep === 'health-permission')
    return <HealthPermission
      onBack={() => prevStep('health-permission')}
      onContinue={() => nextStep('health-permission')}
      onSkip={() => nextStep('health-permission')}
    />

  // Screen 5 — Tier select
  if (onboardingStep === 'tier-select') {
    if (isMinor) { nextStep('tier-select'); return null }
    return <TierSelect userId={userId}
      onBack={() => prevStep('tier-select')}
      onComplete={async (tier) => {
        setProfile(prev => ({ ...prev, tier, tier_chosen: true }))
        nextStep('tier-select')
      }} />
  }

  // Screen 6 — Wake time
  if (onboardingStep === 'wake-time')
    return <WakeTime
      onBack={() => prevStep('wake-time')}
      onContinue={(wakeMinutes) => {
        setOnboardingData(prev => ({ ...prev, wakeMinutes }))
        nextStep('wake-time')
      }} />

  // Screen 7 — Movement preference
  if (onboardingStep === 'movement')
    return <MovementPreference
      onBack={() => prevStep('movement')}
      onContinue={(movementPreference) => {
        setOnboardingData(prev => ({ ...prev, movementPreference }))
        nextStep('movement')
      }} />

  // Screen 8 — Library habit selection
  if (onboardingStep === 'habit-select')
    return <HabitSelect
      onBack={() => prevStep('habit-select')}
      onContinue={(libraryKeys) => {
        setOnboardingData(prev => ({ ...prev, libraryKeys }))
        nextStep('habit-select')
      }} />

  // Screen 9 — Custom habits (skipped for Free tier inside the component)
  if (onboardingStep === 'custom-habits') {
    const effectiveTier = getEffectiveTier(profile?.tier || 'free', profile?.created_at)

    const slots = TIER_CONFIG[effectiveTier]?.custom_habit_slots || 0
    if (slots === 0) {
      // Skip straight to next step for Free tier
      nextStep('custom-habits')
      return null
    }
    return <CustomHabits
      profile={profile}
      onContinue={(customHabits) => {
        setOnboardingData(prev => ({ ...prev, customHabits }))
        nextStep('custom-habits')
      }}
      onSkip={() => nextStep('custom-habits')}
    />
  }

  // Screen 10 — Notifications
  if (onboardingStep === 'notifications')
    return <NotificationsSetup
      onBack={() => prevStep('notifications')}
      onContinue={(notificationPrefs) => {
        setOnboardingData(prev => ({ ...prev, notificationPrefs }))
        nextStep('notifications')
      }} />

  // Screen 11 — Ready
  if (onboardingStep === 'ready')
    return <OnboardingReady
      profile={profile}
      libraryKeys={onboardingData.libraryKeys}
      customHabits={onboardingData.customHabits}
      wakeMinutes={onboardingData.wakeMinutes}
      movementPreference={onboardingData.movementPreference}
      onComplete={completeOnboarding}
    />

  // Fallback — if tier not chosen yet
  if (!profile?.tier_chosen)
    return <TierSelect userId={userId} onComplete={(tier) => {
      setProfile(prev => ({ ...prev, tier, tier_chosen: true }))
    }} />


  // ── Main app ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '448px', position: 'relative' }}>

        <div key={activeTab} style={{ width: '100%', padding: '32px 16px 96px', animation: 'fadeInUp 0.2s ease' }}>
          {activeTab === 'home' && (
            <HomeTab
              session={session}
              profile={profile}
              streak={streak}
              streakFreeze={streakFreeze}
              userHabits={userHabits}
              todayLogs={todayLogs}
              todaySummary={todaySummary}
              isMinor={isMinor}
              today={today}
              onRefresh={fetchData}
              persistedHabitState={persistedHabitState}
              onHabitStateChange={setPersistedHabitState}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab
              session={session}
              profile={profile}
              streak={streak}
              userHabits={userHabits}
            />
          )}

          {activeTab === 'rewards' && (
            <RewardsTab
              session={session}
              profile={profile}
              isMinor={isMinor}
            />
          )}
          {activeTab === 'referrals' && (
            <ReferralTab
              session={session}
              profile={profile}
              isMinor={isMinor}
              streak={streak}
              todaySummary={todaySummary}
              todayPoints={todaySummary?.total_points || 0}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              session={session}
              profile={profile}
              streak={streak}
              onSignOut={signOut}
              onRefresh={fetchData}
            />
          )}

        </div>

        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  )

}
