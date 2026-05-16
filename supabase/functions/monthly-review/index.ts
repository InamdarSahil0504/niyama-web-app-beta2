// ─── NIYAMA PHASE 6 — MONTHLY REVIEW EDGE FUNCTION ──────────────────────────
// Scheduled: 0 9 1 * * (1st of every month at 9:00 AM UTC)
// Sends a monthly habit review email to every active user.
// AI_INSIGHTS_ENABLED: set to true only when Claude Haiku key is confirmed live.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const AI_INSIGHTS_ENABLED = false

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

const CORE_HABIT_KEYS = ['wake', 'sleep', 'steps']
const LIBRARY_HABIT_KEYS = ['screen_time', 'no_phone', 'stand', 'sunlight', 'no_late_food', 'recovery', 'meditation']
const ALL_HABIT_KEYS = [...CORE_HABIT_KEYS, ...LIBRARY_HABIT_KEYS]

const HABIT_LABELS: Record<string, string> = {
  wake: 'Wake Consistency',
  sleep: 'Sleep Duration',
  steps: 'Steps',
  screen_time: 'Screen Time',
  no_phone: 'No Phone after 10:30pm',
  stand: 'Stand Consistency',
  sunlight: 'Morning Sunlight',
  no_late_food: 'No Late Food',
  recovery: 'Recovery Practice',
  meditation: 'Meditation',
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

function getLastMonthRange(): { monthStart: string; monthEnd: string; monthName: string; daysInMonth: number } {
  const now = new Date()
  const year = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear()
  const month = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1

  const firstDay = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  const daysInMonth = lastDay.getUTCDate()

  const fmt = (d: Date) => d.toISOString().split('T')[0]

  return {
    monthStart: fmt(firstDay),
    monthEnd: fmt(lastDay),
    monthName: MONTH_NAMES[month],
    daysInMonth,
  }
}

function staticInsight(completionPct: number): string {
  if (completionPct >= 80) return 'Exceptional month — you are in the top tier of Niyama members. Keep this momentum.'
  if (completionPct >= 60) return 'Strong month. You showed up more days than not — that is what discipline looks like.'
  if (completionPct >= 40) return 'A building month. Each day you logged matters more than you realize.'
  return 'Every journey has setbacks. This month is done — a new one is your reset.'
}

async function aiInsight(
  firstName: string,
  activeDays: number,
  daysInMonth: number,
  totalHabits: number,
  bestHabit: string,
  worstHabit: string,
  completionPct: number,
): Promise<string> {
  if (!AI_INSIGHTS_ENABLED || !ANTHROPIC_API_KEY) return staticInsight(completionPct)
  try {
    const prompt = `You are Niyama, a concise wellness coach. Write exactly 2 sentences (max 45 words total) of warm, motivating monthly feedback for ${firstName}: ${activeDays}/${daysInMonth} active days (${completionPct}%), ${totalHabits} habits logged, best habit: ${bestHabit}, needs work: ${worstHabit}. No greetings, no emojis, just insight.`
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 90,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data?.content?.[0]?.text?.trim() || staticInsight(completionPct)
  } catch {
    return staticInsight(completionPct)
  }
}

function barWidth(count: number, max: number): number {
  if (max === 0) return 0
  return Math.round((count / max) * 100)
}

function buildEmailHtml(params: {
  firstName: string
  monthName: string
  activeDays: number
  daysInMonth: number
  totalHabits: number
  completionPct: number
  successfulDays: number
  perfectDays: number
  rewardEstimate: string
  bestHabit: string
  worstHabit: string
  topHabits: { label: string; count: number; max: number }[]
  insight: string
}): string {
  const {
    firstName, monthName, activeDays, daysInMonth, totalHabits, completionPct,
    successfulDays, perfectDays, rewardEstimate, bestHabit, worstHabit, topHabits, insight,
  } = params

  const scoreColor = completionPct >= 70 ? '#4A7A68' : completionPct >= 45 ? '#C9973A' : '#C96A52'

  const habitBars = topHabits.map(h => {
    const w = barWidth(h.count, h.max)
    return `
    <tr>
      <td style="padding:6px 0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:140px;font-size:13px;color:#3D5249;font-weight:500;padding-right:12px;white-space:nowrap;overflow:hidden;">${h.label}</td>
            <td style="vertical-align:middle;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#E0E8E4;border-radius:4px;height:8px;overflow:hidden;">
                    <div style="width:${w}%;background:#4A7A68;height:8px;border-radius:4px;"></div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="width:36px;text-align:right;font-size:13px;font-weight:700;color:#1A2E25;padding-left:10px;">${h.count}d</td>
          </tr>
        </table>
      </td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Niyama ${monthName} Review</title>
</head>
<body style="margin:0;padding:0;background:#F2F5F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F5F3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4A7A68 0%,#3D6657 100%);padding:36px 32px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.75);letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">${monthName} Review</p>
            <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">${firstName}'s Month</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">Your full Niyama breakdown 🌿</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">

            <!-- 2x3 Stats Grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <td width="31%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:16px 12px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:${scoreColor};letter-spacing:-0.03em;">${activeDays}<span style="font-size:14px;color:#8A9E96;">/${daysInMonth}</span></p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Active Days</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:16px 12px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#1A2E25;letter-spacing:-0.03em;">${totalHabits}</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Habits Logged</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:16px 12px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:${scoreColor};letter-spacing:-0.03em;">${completionPct}%</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Completion</p>
                </td>
              </tr>
              <tr><td colspan="5" style="height:10px;"></td></tr>
              <tr>
                <td width="31%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:16px 12px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#1A2E25;letter-spacing:-0.03em;">${successfulDays}</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Successful Days</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:16px 12px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#1A2E25;letter-spacing:-0.03em;">${perfectDays}</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Perfect Days</p>
                </td>
                <td width="4%"></td>
                <td width="31%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:16px 12px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:28px;font-weight:800;color:#4A7A68;letter-spacing:-0.03em;">$${rewardEstimate}</p>
                  <p style="margin:0;font-size:11px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Est. Reward</p>
                </td>
              </tr>
            </table>

            <!-- Gold reward card -->
            <div style="background:linear-gradient(135deg,#FDF3DC 0%,#F9E8B8 100%);border:1px solid #E8C96A;border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#B8860B;text-transform:uppercase;letter-spacing:0.08em;">💰 ${monthName} Reward Estimate</p>
              <p style="margin:0 0 4px;font-size:36px;font-weight:800;color:#8B6914;letter-spacing:-0.03em;">$${rewardEstimate}</p>
              <p style="margin:0;font-size:13px;color:#A07820;">Final amount calculated at month close.</p>
            </div>

            <!-- Best / Focus -->
            <div style="border-left:4px solid #4A7A68;background:#F0F7F4;border-radius:0 12px 12px 0;padding:16px 18px;margin-bottom:10px;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#4A7A68;text-transform:uppercase;letter-spacing:0.08em;">✓ Best habit</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1A2E25;">${bestHabit}</p>
            </div>
            <div style="border-left:4px solid #C9973A;background:#FDF8EF;border-radius:0 12px 12px 0;padding:16px 18px;margin-bottom:24px;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#C9973A;text-transform:uppercase;letter-spacing:0.08em;">↑ Priority next month</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1A2E25;">${worstHabit}</p>
            </div>

            <!-- Habit bar charts -->
            <div style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#8A9E96;text-transform:uppercase;letter-spacing:0.08em;">Habit Completion — Top Habits</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${habitBars}
              </table>
            </div>

            <!-- Insight -->
            <div style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:20px;margin-bottom:28px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#8A9E96;text-transform:uppercase;letter-spacing:0.08em;">Niyama Insight</p>
              <p style="margin:0;font-size:15px;color:#1A2E25;line-height:1.6;font-style:italic;">"${insight}"</p>
            </div>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="https://app.niyamalife.com" style="display:inline-block;background:#4A7A68;color:#FFFFFF;font-size:15px;font-weight:700;padding:14px 40px;border-radius:12px;text-decoration:none;letter-spacing:-0.01em;">Open Niyama →</a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px;text-align:center;border-top:1px solid #E0E8E4;">
            <p style="margin:0 0 4px;font-size:13px;color:#8A9E96;">Niyama · Build discipline. Earn rewards.</p>
            <p style="margin:0;font-size:12px;color:#B0BFBA;">You're receiving this because you have a Niyama account.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function processUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  email: string,
  firstName: string,
  tier: string,
  monthStart: string,
  monthEnd: string,
  monthName: string,
  daysInMonth: number,
): Promise<{ sent: boolean; reason?: string }> {
  // Fetch habit_logs for the month
  const { data: logs, error: logsError } = await supabase
    .from('habit_logs')
    .select('date, habit_key, completed')
    .eq('user_id', userId)
    .gte('date', monthStart)
    .lte('date', monthEnd)
    .eq('completed', true)

  if (logsError) return { sent: false, reason: `logs error: ${logsError.message}` }
  if (!logs || logs.length === 0) return { sent: false, reason: 'no logs this month' }

  // Skip if fewer than 5 distinct active days
  const activeDatesSet = new Set(logs.map(l => l.date))
  const activeDays = activeDatesSet.size
  if (activeDays < 5) return { sent: false, reason: `only ${activeDays} active days (min 5)` }

  // Fetch daily_summaries for successful/perfect day counts
  const { data: summaries } = await supabase
    .from('daily_summaries')
    .select('date, is_successful, is_perfect, total_points')
    .eq('user_id', userId)
    .gte('date', monthStart)
    .lte('date', monthEnd)

  const successfulDays = summaries?.filter(s => s.is_successful).length ?? 0
  const perfectDays = summaries?.filter(s => s.is_perfect).length ?? 0
  const monthlyPoints = summaries?.reduce((sum, s) => sum + (s.total_points ?? 0), 0) ?? 0

  // Completion percentage (active days / days in month)
  const completionPct = Math.round((activeDays / daysInMonth) * 100)

  // Habit counts
  const habitCounts: Record<string, number> = {}
  for (const key of ALL_HABIT_KEYS) habitCounts[key] = 0
  for (const log of logs) {
    if (habitCounts[log.habit_key] !== undefined) {
      habitCounts[log.habit_key]++
    }
  }

  const sortedHabits = Object.entries(habitCounts).sort(([, a], [, b]) => b - a)
  const bestKey = sortedHabits[0]?.[0] ?? 'wake'
  const loggedHabits = sortedHabits.filter(([, c]) => c > 0)
  const worstKey = loggedHabits.length > 1
    ? loggedHabits[loggedHabits.length - 1][0]
    : LIBRARY_HABIT_KEYS.find(k => !loggedHabits.map(([key]) => key).includes(k)) ?? loggedHabits[0]?.[0] ?? 'meditation'

  // Top habits for bar chart (top 6 by count)
  const maxCount = sortedHabits[0]?.[1] ?? 1
  const topHabits = sortedHabits
    .filter(([, c]) => c > 0)
    .slice(0, 6)
    .map(([key, count]) => ({ label: HABIT_LABELS[key] ?? key, count, max: maxCount }))

  // Reward estimate — simplified: points / 1000 capped at tier cap
  const TIER_CAPS: Record<string, number> = {
    free_trial: 2.50, free_expired: 0, basic: 5.00, plus: 10.00, premium: 25.00,
  }
  const cap = TIER_CAPS[tier] ?? 0
  const rewardRaw = cap > 0 ? Math.min(monthlyPoints / 1000, cap) : 0
  const rewardEstimate = rewardRaw.toFixed(2)

  const insight = await aiInsight(firstName, activeDays, daysInMonth, logs.length, HABIT_LABELS[bestKey] ?? bestKey, HABIT_LABELS[worstKey] ?? worstKey, completionPct)

  const html = buildEmailHtml({
    firstName,
    monthName,
    activeDays,
    daysInMonth,
    totalHabits: logs.length,
    completionPct,
    successfulDays,
    perfectDays,
    rewardEstimate,
    bestHabit: HABIT_LABELS[bestKey] ?? bestKey,
    worstHabit: HABIT_LABELS[worstKey] ?? worstKey,
    topHabits,
    insight,
  })

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Niyama <sahil.inamdar@niyamalife.com>',
      to: email,
      subject: `${firstName}, your ${monthName} review is here 🌿`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return { sent: false, reason: `resend error: ${body}` }
  }

  return { sent: true }
}

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { monthStart, monthEnd, monthName, daysInMonth } = getLastMonthRange()

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, first_name, tier, created_at')
    .not('email', 'is', null)

  if (profilesError || !profiles) {
    return new Response(JSON.stringify({ error: profilesError?.message ?? 'no profiles' }), { status: 500 })
  }

  const results: { userId: string; email: string; sent: boolean; reason?: string }[] = []

  for (const profile of profiles) {
    const result = await processUser(
      supabase,
      profile.id,
      profile.email,
      profile.first_name ?? 'there',
      profile.tier ?? 'free_trial',
      monthStart,
      monthEnd,
      monthName,
      daysInMonth,
    )
    results.push({ userId: profile.id, email: profile.email, ...result })
  }

  const sent = results.filter(r => r.sent).length
  const skipped = results.filter(r => !r.sent).length

  console.log(`monthly-review: ${sent} sent, ${skipped} skipped. Month: ${monthName} (${monthStart} → ${monthEnd})`)

  return new Response(
    JSON.stringify({ month: monthName, range: `${monthStart} → ${monthEnd}`, sent, skipped, results }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
