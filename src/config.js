// ─── BETA 2 CORE CONFIG ───────────────────────────────────────────────────────
// Single source of truth for all habit definitions, tier rules, and helpers.
// Import from here in every component — never redefine these elsewhere.

// ─── CORE HABITS (3 fixed — auto-verified via Health app) ────────────────────
export const CORE_HABITS = [
  { key: 'wake', label: 'Wake before chosen time', points: 100, icon: '🌅', verified: true },
  { key: 'no_phone', label: 'No phone after 10:30pm', points: 100, icon: '📵', verified: true },
  { key: 'steps', label: 'Steps / physical activity', points: 100, icon: '👟', verified: true, tiered: true },
]

// Steps are tiered — points depend on count
export const STEPS_TIERS = [
  { threshold: 10000, points: 100 },
  { threshold: 7500, points: 75 },
  { threshold: 5000, points: 50 },
  { threshold: 0, points: 0 },
]

export function calcStepsPoints(steps) {
  for (const tier of STEPS_TIERS) {
    if (steps >= tier.threshold) return tier.points
  }
  return 0
}

// ─── LIBRARY HABITS (user picks 4 of 10) ─────────────────────────────────────
export const LIBRARY_HABITS = [
  { key: 'meditation', label: 'Meditation / mindfulness (10+ min)', points: 50, icon: '🧘', science: 'Harvard, Oxford, Johns Hopkins' },
  { key: 'screen_time', label: 'Screen time under 3 hours', points: 50, icon: '🖥️', science: 'Jonathan Haidt, NYU' },
  { key: 'reading', label: 'Read for 30 minutes', points: 50, icon: '📚', science: 'Cognitive performance research' },
  { key: 'no_late_food', label: 'No food after 8pm', points: 50, icon: '🍽️', science: 'Salk Institute circadian biology' },
  { key: 'cold_shower', label: 'Cold shower / cold exposure', points: 50, icon: '🚿', science: 'Norepinephrine and recovery research' },
  { key: 'gratitude', label: 'Gratitude journaling', points: 50, icon: '📓', science: 'UC Davis, University of Pennsylvania' },
  { key: 'no_alcohol', label: 'No alcohol', points: 50, icon: '🚫', science: 'Global health and longevity research' },
  { key: 'hydration', label: '8 glasses of water', points: 50, icon: '💧', science: 'Universal physiology consensus' },
  { key: 'sunlight', label: 'Morning sunlight (10+ min)', points: 50, icon: '☀️', science: 'Andrew Huberman, Stanford' },
  { key: 'stretching', label: 'Stretching or yoga (15+ min)', points: 50, icon: '🤸', science: 'Peter Attia mobility and longevity' },
]

// Default library selection for users who skip customisation
export const DEFAULT_LIBRARY_KEYS = ['sunlight', 'hydration', 'meditation', 'no_late_food']

// ─── POINTS ───────────────────────────────────────────────────────────────────
export const POINTS = {
  core_habit: 100,   // each core habit completed (steps tiered separately)
  library_habit: 50,   // each library/custom habit completed
  successful_day: 50,   // bonus when 5/9 with 2+ core
  perfect_day: 100,   // bonus when 9/9 (stacks with successful_day)
  social_share: 20,   // once per day, honour system
  daily_max: 750,
  monthly_max: 22500,
}

// ─── SUCCESSFUL DAY RULE ──────────────────────────────────────────────────────
// Any 5 of 9 habits completed, with at least 2 being core habits
export function isDaySuccessful(coreCompleted, totalCompleted) {
  return totalCompleted >= 5 && coreCompleted >= 2
}

export function isDayPerfect(totalCompleted) {
  return totalCompleted >= 9
}

// ─── POINTS CALCULATION ───────────────────────────────────────────────────────
export function calcDayPoints(corePoints, libraryCompleted, customCompleted) {
  // corePoints passed directly (steps are tiered so caller computes core pts)
  const libraryPoints = libraryCompleted * POINTS.library_habit
  const customPoints = customCompleted * POINTS.library_habit
  const coreCompleted = corePoints > 0 ? Math.ceil(corePoints / 100) : 0 // approx for bonus calc
  const totalCompleted = coreCompleted + libraryCompleted + customCompleted
  const successBonus = isDaySuccessful(coreCompleted, totalCompleted) ? POINTS.successful_day : 0
  const perfectBonus = isDayPerfect(totalCompleted) ? POINTS.perfect_day : 0
  return Math.min(corePoints + libraryPoints + customPoints + successBonus + perfectBonus, POINTS.daily_max)
}

// ─── TIER CONFIG ──────────────────────────────────────────────────────────────
// Reward caps include milestone bonuses per spec:
// Plus:    base $10 + 20-day $2.50 + successful month $5.00          = $17.50 max
// Premium: base $22.50 + 10-day $2.50 + 20-day $5.00 + succ $7.50 + perf $7.50 = $45.00 max
export const TIER_CONFIG = {
  free_trial: {
    reward_cap: 2.50,
    min_days: 10,
    price: 0,
    price_annual: null,
    stripe_price_id_monthly: null,
    stripe_price_id_annual: null,
    reward_delivery: 'manual',
    label: 'Free',
    trial: true,
    custom_habit_slots: 0,
    milestones: {},
  },
  free_expired: {
    reward_cap: 0,
    min_days: null,
    price: 0,
    price_annual: null,
    stripe_price_id_monthly: null,
    stripe_price_id_annual: null,
    reward_delivery: null,
    label: 'Free',
    trial: false,
    custom_habit_slots: 0,
    milestones: {},
  },
  basic: {
    reward_cap: 5.00,
    min_days: 10,
    price: 0.99,
    price_annual: 9.99,
    stripe_price_id_monthly: 'price_1TPaBo9crPKLFCMF39E116lA',
    stripe_price_id_annual: 'price_1TPaBo9crPKLFCMFNkXgFJUF',
    reward_delivery: 'manual',
    label: 'Basic',
    custom_habit_slots: 1,
    milestones: {},
  },
  plus: {
    reward_cap: 10.00,
    min_days: 7,
    price: 4.99,
    price_annual: 49.99,
    stripe_price_id_monthly: 'price_1TPaD49crPKLFCMF22QHLlq1',
    stripe_price_id_annual: 'price_1TPaD49crPKLFCMFiYXkQpz0',
    reward_delivery: 'manual',
    label: 'Plus',
    custom_habit_slots: 2,
    milestones: {
      days_20_bonus: 2.50,
      successful_month_bonus: 5.00,
    },
    max_cap: 17.50,
  },
  premium: {
    reward_cap: 22.50,
    min_days: 5,
    price: 14.99,
    price_annual: 149.99,
    stripe_price_id_monthly: 'price_1TPaE09crPKLFCMFaFzsnPrn',
    stripe_price_id_annual: 'price_1TPaE09crPKLFCMFIgphzKgO',
    reward_delivery: 'manual',
    label: 'Premium',
    custom_habit_slots: 2,
    milestones: {
      days_10_bonus: 2.50,
      days_20_bonus: 5.00,
      successful_month_bonus: 7.50,
      perfect_month_bonus: 7.50,
    },
    max_cap: 45.00,
  },
}

// ─── TIER HELPERS ─────────────────────────────────────────────────────────────
export function getMemberMonths(createdAt) {
  if (!createdAt) return 0
  const joined = new Date(createdAt)
  const now = new Date()
  return (now.getFullYear() - joined.getFullYear()) * 12
    + (now.getMonth() - joined.getMonth())
}

export function getEffectiveTier(tier, createdAt) {
  if (tier !== 'free') return tier
  return getMemberMonths(createdAt) < 3 ? 'free_trial' : 'free_expired'
}

export function calcReward(monthlyPoints, effectiveTier, successfulDays, isSuccessfulMonth, isPerfectMonth, consecutiveInactiveDays) {
  const config = TIER_CONFIG[effectiveTier]
  if (!config || config.reward_cap === 0) return '0.00'
  if ((consecutiveInactiveDays || 0) >= 5) return '0.00'
  if (!config.min_days || (successfulDays || 0) < config.min_days) return '0.00'

  const base = Math.min((monthlyPoints || 0) / 1000, config.reward_cap)
  let bonus = 0

  if (config.milestones) {
    if (config.milestones.days_10_bonus && successfulDays >= 10) bonus += config.milestones.days_10_bonus
    if (config.milestones.days_20_bonus && successfulDays >= 20) bonus += config.milestones.days_20_bonus
    if (config.milestones.successful_month_bonus && isSuccessfulMonth) bonus += config.milestones.successful_month_bonus
    if (config.milestones.perfect_month_bonus && isPerfectMonth) bonus += config.milestones.perfect_month_bonus
  }

  const total = Math.min(base + bonus, config.max_cap || config.reward_cap)
  return total.toFixed(2)
}

// ─── THEME ────────────────────────────────────────────────────────────────────
export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'salmon') {
    root.style.setProperty('--theme-bg', '#F7F4F4')
    root.style.setProperty('--theme-primary', '#D4735F')
    root.style.setProperty('--theme-secondary', '#5A8A78')
    root.style.setProperty('--theme-border', '#E5D9D5')
    root.style.setProperty('--theme-card', '#FFFFFF')
    root.style.setProperty('--theme-primary-light', '#FCEEE9')
    root.style.setProperty('--theme-secondary-light', '#EAF2EE')
    root.style.setProperty('--theme-text', '#2E1A16')
    root.style.setProperty('--theme-text-secondary', '#634A42')
    root.style.setProperty('--theme-text-muted', '#A88C84')
  } else {
    root.style.setProperty('--theme-bg', '#F4F7F5')
    root.style.setProperty('--theme-primary', '#5A8A78')
    root.style.setProperty('--theme-secondary', '#D4735F')
    root.style.setProperty('--theme-border', '#D9E5DF')
    root.style.setProperty('--theme-card', '#FFFFFF')
    root.style.setProperty('--theme-primary-light', '#EAF2EE')
    root.style.setProperty('--theme-secondary-light', '#FCEEE9')
    root.style.setProperty('--theme-text', '#1A2E25')
    root.style.setProperty('--theme-text-secondary', '#4A6358')
    root.style.setProperty('--theme-text-muted', '#8AA89C')
  }
}

// ─── EVENT TRACKING ───────────────────────────────────────────────────────────
export async function trackEvent(supabase, userId, eventType, eventData = {}) {
  try {
    await supabase.from('app_events').insert({
      user_id: userId,
      event_type: eventType,
      event_data: { ...eventData, timestamp: new Date().toISOString(), hour: new Date().getHours() }
    })
  } catch (e) { }
}

// ─── DATE HELPER ──────────────────────────────────────────────────────────────
export function getTodayString() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
  })
}
