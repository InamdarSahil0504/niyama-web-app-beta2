// ─── NIYAMA PHASE 6 — CANONICAL CONFIG ───────────────────────────────────────
// Single source of truth for all business logic.
// SHARED SECTION is identical to niyama-mobile-rebuild/src/config.js.
// Never redefine habits, points, tiers, or reward logic elsewhere.
// ─────────────────────────────────────────────────────────────────────────────

// ─── SHARED: TIER CONFIG ──────────────────────────────────────────────────────
// custom_habit_slots: 0 = can track custom habits but earn 0 pts
// max_cap: absolute ceiling including milestones (undefined = reward_cap)

export const TIER_CONFIG = {
  free_trial: {
    reward_cap: 2.50,
    price: 0,
    stripe_price_id_monthly: null,
    stripe_price_id_annual: null,
    label: 'Free',
    trial: true,
    custom_habit_slots: 0,
    milestones: {},
    rewards_active_months: 3,
  },
  free_expired: {
    reward_cap: 0,
    price: 0,
    label: 'Free',
    trial: false,
    custom_habit_slots: 0,
    milestones: {},
  },
  basic: {
    reward_cap: 5.00,
    price: 0.99,
    price_annual: 9.99,
    stripe_price_id_monthly: 'price_1TPaBo9crPKLFCMF39E116lA',
    stripe_price_id_annual: 'price_1TPaBo9crPKLFCMFNkXgFJUF',
    label: 'Basic',
    custom_habit_slots: 0,
    milestones: {},
  },
  plus: {
    reward_cap: 10.00,
    max_cap: 17.50,
    price: 4.99,
    price_annual: 49.99,
    stripe_price_id_monthly: 'price_1TPaD49crPKLFCMF22QHLlq1',
    stripe_price_id_annual: 'price_1TPaD49crPKLFCMFiYXkQpz0',
    label: 'Plus',
    custom_habit_slots: 2,
    milestones: {
      days_20_bonus: 2.50,
      successful_month_bonus: 5.00,
      perfect_month_bonus: 7.50,
    },
  },
  premium: {
    reward_cap: 25.00,
    max_cap: 35.00,
    price: 14.99,
    price_annual: 149.99,
    stripe_price_id_monthly: 'price_1TPaE09crPKLFCMFaFzsnPrn',
    stripe_price_id_annual: 'price_1TPaE09crPKLFCMFIgphzKgO',
    label: 'Premium',
    custom_habit_slots: 4,
    milestones: {
      days_10_bonus: 2.50,
      days_20_bonus: 5.00,
      successful_month_bonus: 7.50,
      perfect_month_bonus: 10.00,
    },
  },
}

// ─── SHARED: ACCOUNT AGE GATES (days since signup) ───────────────────────────
// Only enforced for free_trial. Paid tiers have no age gate.

export const AGE_GATE = {
  baseCapRedemption: 30,
  milestoneBonuses: 60,
}

// ─── SHARED: POINTS CONVERSION ───────────────────────────────────────────────

export const POINTS_PER_DOLLAR = 1000  // 1,000 pts = $1.00 (all tiers)

// ─── SHARED: CORE HABITS (3) — HealthKit auto-verified ───────────────────────

export const CORE_HABITS = [
  { key: 'wake',  label: 'Wake Consistency',         points: 100, icon: '🌅', verified: true },
  { key: 'sleep', label: 'Sleep Duration (7–9 hrs)', points: 100, icon: '😴', verified: true },
  { key: 'steps', label: 'Steps',                    points: null, icon: '👟', verified: true, tiered: true },
]

// ─── SHARED: STEPS TIERS ─────────────────────────────────────────────────────

export const STEPS_TIERS = [
  { threshold: 10000, points: 100 },
  { threshold: 7500,  points: 75 },
  { threshold: 5000,  points: 50 },
  { threshold: 0,     points: 0 },
]

export function calcStepsPoints(steps) {
  for (const tier of STEPS_TIERS) {
    if (steps >= tier.threshold) return tier.points
  }
  return 0
}

// ─── SHARED: LIBRARY HABITS (7) — Fixed for all users, no selection ──────────

export const LIBRARY_HABITS = [
  { key: 'screen_time',  label: 'Screen Time < 4 hours',    points: 50, icon: '📵', type: 'honour' },
  { key: 'no_phone',     label: 'No Phone after 10:30pm',   points: 50, icon: '🌙', type: 'honour' },
  { key: 'stand',        label: 'Stand Consistency',         points: 50, icon: '🧍', type: 'verified' },
  { key: 'sunlight',     label: 'Morning Sunlight (10+ min)', points: 50, icon: '☀️', type: 'confirmable' },
  { key: 'no_late_food', label: 'No Late Food after 8pm',   points: 50, icon: '🍽️', type: 'confirmable' },
  { key: 'recovery',     label: 'Recovery Practice',         points: 50, icon: '🧘', type: 'confirmable' },
  { key: 'meditation',   label: 'Meditation (10+ min)',      points: 50, icon: '🪷', type: 'honour' },
]

// ─── SHARED: POINTS CONSTANTS ────────────────────────────────────────────────

export const POINTS = {
  core_habit: 100,
  library_habit: 50,
  custom_habit: 25,
  successful_day: 50,
  perfect_day: 100,
}

// ─── SHARED: DAY SUCCESS / PERFECT RULES ─────────────────────────────────────
// Custom habits excluded from thresholds. Arguments are integer counts.

export function isSuccessfulDay(coreCompleted, libraryCompleted) {
  return coreCompleted >= 2 && libraryCompleted >= 3
}

export function isPerfectDay(coreCompleted, libraryCompleted) {
  return coreCompleted >= 3 && libraryCompleted >= 7
}

// Aliases kept for backward compatibility with older call sites
export const isDaySuccessful = isSuccessfulDay
export const isDayPerfect    = isPerfectDay

// ─── SHARED: DAY POINTS CALCULATOR ───────────────────────────────────────────
// corePoints: already computed (steps tiered)
// libraryCompleted: integer count
// customCompleted: integer count of completed custom habits
// tier: effective tier key (use getEffectiveTier first)
// Returns integer total — no daily cap.

export function calcDayPoints(corePoints, libraryCompleted, customCompleted, tier) {
  const libraryPoints = libraryCompleted * POINTS.library_habit
  const slots = TIER_CONFIG[tier]?.custom_habit_slots ?? 0
  const customPoints = Math.min(customCompleted ?? 0, slots) * POINTS.custom_habit
  // Math.ceil(corePoints / 100) correctly yields completed count for all step tiers
  const coreCompleted = corePoints > 0 ? Math.ceil(corePoints / 100) : 0
  const successBonus = isSuccessfulDay(coreCompleted, libraryCompleted) ? POINTS.successful_day : 0
  const perfectBonus = isPerfectDay(coreCompleted, libraryCompleted) ? POINTS.perfect_day : 0
  return corePoints + libraryPoints + customPoints + successBonus + perfectBonus
}

// ─── SHARED: TIER HELPERS ────────────────────────────────────────────────────

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

// ─── SHARED: REWARD CALCULATOR ───────────────────────────────────────────────
// Milestones are ADDITIVE — every qualifying threshold adds its bonus.
// Age gate applies only to free_trial (not paid tiers).
// consecutiveInactiveDays ≥ 5 → $0 for that month.

export function calcReward(
  monthlyPoints,
  effectiveTier,
  successfulDays,
  isSuccessfulMonth,
  isPerfectMonth,
  consecutiveInactiveDays,
  accountCreatedAt,
) {
  const config = TIER_CONFIG[effectiveTier]
  if (!config || config.reward_cap === 0) return '0.00'
  if ((consecutiveInactiveDays || 0) >= 5) return '0.00'

  // Free trial: age gate on redemption
  if (effectiveTier === 'free_trial' && accountCreatedAt) {
    const days = Math.floor((Date.now() - new Date(accountCreatedAt)) / 86400000)
    if (days < AGE_GATE.baseCapRedemption) return '0.00'
  }

  const base = Math.min((monthlyPoints || 0) / POINTS_PER_DOLLAR, config.reward_cap)
  let bonus = 0

  if (config.milestones) {
    const milestoneEligible =
      effectiveTier !== 'free_trial' ||
      !accountCreatedAt ||
      Math.floor((Date.now() - new Date(accountCreatedAt)) / 86400000) >= AGE_GATE.milestoneBonuses

    if (milestoneEligible) {
      if (config.milestones.days_10_bonus      && (successfulDays || 0) >= 10)  bonus += config.milestones.days_10_bonus
      if (config.milestones.days_20_bonus      && (successfulDays || 0) >= 20)  bonus += config.milestones.days_20_bonus
      if (config.milestones.successful_month_bonus && isSuccessfulMonth)         bonus += config.milestones.successful_month_bonus
      if (config.milestones.perfect_month_bonus    && isPerfectMonth)            bonus += config.milestones.perfect_month_bonus
    }
  }

  const total = Math.min(base + bonus, config.max_cap || config.reward_cap)
  return total.toFixed(2)
}

// ─── SHARED: DATE HELPER ─────────────────────────────────────────────────────

export function getTodayString() {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
}

// ─── WEB-ONLY: TREMENDOUS CONFIG ─────────────────────────────────────────────

export const TREMENDOUS_CONFIG = {
  api_url_test:       'https://testflight.tremendous.com/api/v2',
  api_url_production: 'https://app.tremendous.com/api/v2',
}

// ─── WEB-ONLY: EVENT TRACKING ────────────────────────────────────────────────

export async function trackEvent(supabase, userId, eventType, eventData = {}) {
  const payload = { ...eventData, timestamp: new Date().toISOString(), hour: new Date().getHours() }

  try {
    await supabase.from('app_events').insert({
      user_id: userId,
      event_type: eventType,
      event_data: payload,
    })
  } catch (e) {}

  try {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(eventType, { ...payload, user_id: userId })
    }
  } catch (e) {}

  try {
    if (typeof window !== 'undefined' && window.mixpanel) {
      window.mixpanel.track(eventType, { ...payload, user_id: userId })
    }
  } catch (e) {}
}
