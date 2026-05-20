import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { getEffectiveTier, getTodayString, trackEvent, TIER_CONFIG } from '../../config'

// Onboarding screens
import FounderStory from '../onboarding/FounderStory'
import RulesPage from '../onboarding/RulesPage'
import PersonalDetails from '../onboarding/PersonalDetails'
import HealthPermission from '../onboarding/HealthPermission'
import TierSelect from '../onboarding/TierSelect'
import WakeTime from '../onboarding/WakeTime'
import CustomHabits from '../onboarding/CustomHabits'
import NotificationsSetup from '../onboarding/NotificationsSetup'
import OnboardingReady from '../onboarding/OnboardingReady'

// Dashboard tabs
import HomeTab from './HomeTab'
import AnalyticsTab from './AnalyticsTab'
import RewardsTab from './RewardsTab'
import SettingsTab from './SettingsTab'
import BottomNav from './BottomNav'
import HistoryTab from './HistoryTab'
import HealthTab from './HealthTab'

const STEPS = [
  'founder-story',
  'rules',
  'personal-details',
  'health-permission',
  'tier-select',
  'wake-time',
  'custom-habits',
  'notifications',
  'ready',
]

export default function Dashboard({ session }) {
  const [profile, setProfile] = useState(null)
  const [streak, setStreak] = useState(null)
  const [userHabits, setUserHabits] = useState(null)
  const [todaySummary, setTodaySummary] = useState(null)
  const [todayLogs, setTodayLogs] = useState([])
  const [weekSummaries, setWeekSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('home')
  const [onboardingStep, setOnboardingStep] = useState(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [isMinor, setIsMinor] = useState(false)
  const [streakFreeze, setStreakFreeze] = useState(null)

  // ── Lifted state — survives tab switches ──────────────────────────────────
  const [habitState, setHabitState] = useState({})
  const [stepCount, setStepCount] = useState(0)

  const [onboardingData, setOnboardingData] = useState({
    wakeMinutes: 450,
    customHabits: [],
    notificationPrefs: {},
  })

  const today = getTodayString()
  const userId = session.user.id

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('onboarding') === 'continue') {
      window.history.replaceState({}, '', window.location.pathname)
      localStorage.removeItem('niyama_onboarding_pending')
      localStorage.removeItem('niyama_onboarding_step')
      localStorage.setItem('niyama_restore_step', 'wake-time')
    }

    if (params.get('onboarding') === 'tier') {
      window.history.replaceState({}, '', window.location.pathname)
      localStorage.removeItem('niyama_onboarding_pending')
      localStorage.setItem('niyama_restore_step', 'tier-select')
    }

    fetchData()
  }, [])

  async function fetchData(silent = false) {
    if (!silent) setLoading(true)

    const { data: profileData } = await supabase
      .from('profiles').select('*').eq('id', userId).maybeSingle()

    if (profileData) {
      if (profileData.is_minor) setIsMinor(true)

      const updates = {}
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz && profileData.timezone !== tz) updates.timezone = tz
      if (session.user.email && profileData.email !== session.user.email) updates.email = session.user.email
      if (Object.keys(updates).length > 0) {
        await supabase.from('profiles').update(updates).eq('id', userId)
      }

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
      const coreKeys = ['wake', 'sleep', 'steps']
      const coreCompleted = yesterdayLogs.filter(l => coreKeys.includes(l.habit_key) && l.completed).length
      const libraryCompleted = yesterdayLogs.filter(l => l.habit_type === 'library' && l.completed).length
      const totalCompleted = yesterdayLogs.filter(l => l.completed).length
      const daySuccessful = coreCompleted >= 2 && libraryCompleted >= 3
      const dayPerfect = coreCompleted >= 3 && libraryCompleted >= 7
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
        total_points: totalPoints,
        submitted: true,
        auto_submitted: true,
        submitted_at: new Date().toISOString(),
      }

      if (yesterdaySummary) {
        await supabase.from('daily_summaries').update(autoPayload).eq('id', yesterdaySummary.id)
      } else {
        await supabase.from('daily_summaries').insert(autoPayload)
      }
    }
    // No else-if: if there are no habit_logs for yesterday, do NOT create a daily_summaries
    // row. Brand-new accounts must not get phantom days before their first real submission.

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
        research_consent: true,
        research_consent_at: new Date().toISOString(),
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

    const { data: streakData } = await supabase
      .from('streaks').select('*').eq('user_id', userId).single()
    setStreak(streakData)

    const now2 = new Date()
    const currentMonth2 = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`
    const { data: freezeData } = await supabase
      .from('streak_freezes')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${currentMonth2}-01`)
      .maybeSingle()
    setStreakFreeze(freezeData || null)

    const { data: userHabitData } = await supabase
      .from('user_habits').select('*').eq('user_id', userId).eq('is_active', true)
    setUserHabits(userHabitData || [])

    const { data: logsData } = await supabase
      .from('habit_logs').select('*').eq('user_id', userId).eq('date', today)
    setTodayLogs(logsData || [])

    // ── Build habitState from fresh DB logs — single source of truth ────────
    // Stored in Dashboard so it survives tab switches without ever resetting
    const freshHabitState = {}
    if (logsData) {
      logsData.forEach(log => {
        freshHabitState[log.habit_key] = log.completed
      })
    }
    setHabitState(freshHabitState)

    // ── Reset stepCount only if no steps log exists for today ───────────────
    const stepsLog = logsData?.find(l => l.habit_key === 'steps')
    if (!stepsLog) setStepCount(0)

    const { data: summaryData } = await supabase
      .from('daily_summaries').select('*')
      .eq('user_id', userId).eq('date', today).maybeSingle()
    setTodaySummary(summaryData)

    // ── Last 7 days for streak bar chart ────────────────────────────────────
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sevenDaysAgoStr = sevenDaysAgo.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
    const { data: weekData } = await supabase
      .from('daily_summaries')
      .select('date, total_points, day_successful, perfect_day, submitted')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: true })
    setWeekSummaries(weekData || [])

    setLoading(false)
  }

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
    if (prevStepKey === 'tier-select' && profile?.stripe_subscription_id) return
    setOnboardingStep(prevStepKey)
  }

  async function saveUserHabits(data) {
    const { wakeMinutes } = data
    await supabase.from('profiles').update({
      wake_time_minutes: wakeMinutes,
    }).eq('id', userId)
  }

  async function completeOnboarding() {
    await saveUserHabits(onboardingData)
    await supabase.from('profiles').update({
      onboarding_complete: true,
      wake_time_minutes: onboardingData.wakeMinutes,
      habits_last_changed: new Date().toISOString(),
    }).eq('id', userId)
    trackEvent(supabase, userId, 'onboarding_completed', {
      tier: profile?.tier || 'free',
      wake_minutes: onboardingData.wakeMinutes,
    })
    setProfile(prev => ({ ...prev, onboarding_complete: true }))
    setOnboardingStep(null)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    trackEvent(supabase, userId, 'page_viewed', { page: tab })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <img src="/niyama-icon.svg" alt="Niyama Life"
        style={{ width: '72px', height: '72px', borderRadius: '18px', animation: 'fadeIn 0.5s ease' }} />
      <div style={{ width: '24px', height: '24px', border: '3px solid var(--theme-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  if (onboardingStep === 'founder-story')
    return <FounderStory onContinue={() => nextStep('founder-story')} />

  if (onboardingStep === 'rules')
    return <RulesPage onBack={() => prevStep('rules')} onContinue={async () => {
      await supabase.from('profiles').update({ rules_acknowledged: true }).eq('id', userId)
      nextStep('rules')
    }} />

  if (onboardingStep === 'personal-details')
    return <PersonalDetails userId={userId} onBack={() => prevStep('personal-details')} onContinue={async (minor) => {
      setIsMinor(minor)
      if (minor) {
        await supabase.from('profiles').update({ tier: 'free', tier_chosen: true }).eq('id', userId)
        setProfile(prev => ({ ...prev, tier: 'free', tier_chosen: true, is_minor: true }))
        setOnboardingStep('health-permission')
      } else {
        nextStep('personal-details')
      }
    }} />

  if (onboardingStep === 'health-permission')
    return <HealthPermission
      onBack={() => prevStep('health-permission')}
      onContinue={async (researchConsent) => {
        await supabase.from('profiles').update({
          research_consent: researchConsent,
          research_consent_at: new Date().toISOString(),
        }).eq('id', userId)
        nextStep('health-permission')
      }}
      onSkip={() => nextStep('health-permission')}
    />

  if (onboardingStep === 'tier-select') {
    if (isMinor) { nextStep('tier-select'); return null }
    return <TierSelect userId={userId}
      onBack={() => prevStep('tier-select')}
      onComplete={async (tier) => {
        setProfile(prev => ({ ...prev, tier, tier_chosen: true }))
        nextStep('tier-select')
      }} />
  }

  if (onboardingStep === 'wake-time')
    return <WakeTime
      onBack={() => prevStep('wake-time')}
      onContinue={(wakeMinutes) => {
        setOnboardingData(prev => ({ ...prev, wakeMinutes }))
        nextStep('wake-time')
      }} />

  if (onboardingStep === 'custom-habits')
    return <CustomHabits
      profile={profile}
      onContinue={(customHabits) => {
        setOnboardingData(prev => ({ ...prev, customHabits }))
        nextStep('custom-habits')
      }}
      onSkip={() => nextStep('custom-habits')}
    />

  if (onboardingStep === 'notifications')
    return <NotificationsSetup
      onBack={() => prevStep('notifications')}
      onContinue={(notificationPrefs) => {
        setOnboardingData(prev => ({ ...prev, notificationPrefs }))
        nextStep('notifications')
      }} />

  if (onboardingStep === 'ready')
    return <OnboardingReady
      profile={profile}
      customHabits={onboardingData.customHabits}
      wakeMinutes={onboardingData.wakeMinutes}
      onComplete={completeOnboarding}
    />

  if (!profile?.tier_chosen)
    return <TierSelect userId={userId} onComplete={(tier) => {
      setProfile(prev => ({ ...prev, tier, tier_chosen: true }))
    }} />

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
              weekSummaries={weekSummaries}
              habitState={habitState}
              setHabitState={setHabitState}
              stepCount={stepCount}
              setStepCount={setStepCount}
              isMinor={isMinor}
              today={today}
              onRefresh={() => fetchData(true)}
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
          {activeTab === 'health' && (
            <HealthTab
              session={session}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab
              session={session}
              profile={profile}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab
              session={session}
              profile={profile}
              streak={streak}
              onSignOut={signOut}
              onRefresh={() => fetchData(true)}
            />
          )}
        </div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  )
}
