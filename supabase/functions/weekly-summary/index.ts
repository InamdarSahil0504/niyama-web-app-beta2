// ─── NIYAMA PHASE 6 — WEEKLY SUMMARY EDGE FUNCTION ──────────────────────────
// Scheduled: 0 8 * * 1 (every Monday at 8:00 AM UTC)
// Sends a weekly habit summary email to every active user.
// AI_INSIGHTS_ENABLED: set to true only when Claude Haiku key is confirmed live.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const AI_INSIGHTS_ENABLED = false

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''

// Phase 6 habit keys — must match config.js exactly
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

function getDateRange(): { weekStart: string; weekEnd: string; weekLabel: string } {
  // Last Monday → last Sunday
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun, 1=Mon
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const lastMonday = new Date(now)
  lastMonday.setUTCDate(now.getUTCDate() - daysToLastMonday - 7)
  lastMonday.setUTCHours(0, 0, 0, 0)
  const lastSunday = new Date(lastMonday)
  lastSunday.setUTCDate(lastMonday.getUTCDate() + 6)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const label = `${monthNames[lastMonday.getUTCMonth()]} ${lastMonday.getUTCDate()}–${lastSunday.getUTCDate()}`

  return { weekStart: fmt(lastMonday), weekEnd: fmt(lastSunday), weekLabel: label }
}

function staticInsight(activeDays: number): string {
  if (activeDays >= 6) return 'Outstanding week — you are building real discipline.'
  if (activeDays >= 4) return 'Solid week. Consistency is the hardest part — you are doing it.'
  if (activeDays >= 2) return 'Every habit logged is progress. Small steps compound over time.'
  return 'A fresh week starts Monday. One habit at a time.'
}

async function aiInsight(
  firstName: string,
  activeDays: number,
  totalHabits: number,
  bestHabit: string,
  worstHabit: string,
): Promise<string> {
  if (!AI_INSIGHTS_ENABLED || !ANTHROPIC_API_KEY) return staticInsight(activeDays)
  try {
    const prompt = `You are Niyama, a concise wellness coach. Write exactly 2 sentences (max 40 words total) of warm, motivating feedback for ${firstName}'s week: ${activeDays}/7 active days, ${totalHabits} total habits logged, best habit: ${bestHabit}, needs work: ${worstHabit}. No greetings, no emojis, just insight.`
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    const data = await res.json()
    return data?.content?.[0]?.text?.trim() || staticInsight(activeDays)
  } catch {
    return staticInsight(activeDays)
  }
}

function habitCompletionRate(logs: Record<string, boolean>[], key: string): number {
  const days = logs.filter(l => l[key] === true).length
  return days
}

function buildEmailHtml(params: {
  firstName: string
  weekLabel: string
  activeDays: number
  totalHabits: number
  avgHabitsPerDay: string
  streak: number
  bestHabit: string
  worstHabit: string
  insight: string
}): string {
  const { firstName, weekLabel, activeDays, totalHabits, avgHabitsPerDay, streak, bestHabit, worstHabit, insight } = params

  const scoreColor = activeDays >= 5 ? '#4A7A68' : activeDays >= 3 ? '#C9973A' : '#C96A52'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Niyama Week in Review</title>
</head>
<body style="margin:0;padding:0;background:#F2F5F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F5F3;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4A7A68 0%,#3D6657 100%);padding:36px 32px 32px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.75);letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Week of ${weekLabel}</p>
            <h1 style="margin:0 0 6px;font-size:28px;font-weight:800;color:#FFFFFF;letter-spacing:-0.02em;">${firstName}'s Week</h1>
            <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.85);">Your Niyama summary 🌿</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">

            <!-- 2x2 Stats Grid -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td width="48%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:18px 16px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:34px;font-weight:800;color:${scoreColor};letter-spacing:-0.03em;">${activeDays}<span style="font-size:18px;color:#8A9E96;">/7</span></p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Active Days</p>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:18px 16px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:34px;font-weight:800;color:#1A2E25;letter-spacing:-0.03em;">${totalHabits}</p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Habits Logged</p>
                </td>
              </tr>
              <tr><td colspan="3" style="height:10px;"></td></tr>
              <tr>
                <td width="48%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:18px 16px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:34px;font-weight:800;color:#1A2E25;letter-spacing:-0.03em;">${avgHabitsPerDay}</p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Avg / Day</p>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background:#F7FAF8;border:1px solid #E0E8E4;border-radius:14px;padding:18px 16px;text-align:center;vertical-align:top;">
                  <p style="margin:0 0 4px;font-size:34px;font-weight:800;color:#1A2E25;letter-spacing:-0.03em;">${streak}</p>
                  <p style="margin:0;font-size:12px;font-weight:600;color:#8A9E96;text-transform:uppercase;letter-spacing:0.06em;">Day Streak</p>
                </td>
              </tr>
            </table>

            <!-- Best habit -->
            <div style="border-left:4px solid #4A7A68;background:#F0F7F4;border-radius:0 12px 12px 0;padding:16px 18px;margin-bottom:10px;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#4A7A68;text-transform:uppercase;letter-spacing:0.08em;">✓ Best this week</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1A2E25;">${bestHabit}</p>
            </div>

            <!-- Worst habit -->
            <div style="border-left:4px solid #C9973A;background:#FDF8EF;border-radius:0 12px 12px 0;padding:16px 18px;margin-bottom:24px;">
              <p style="margin:0 0 2px;font-size:11px;font-weight:700;color:#C9973A;text-transform:uppercase;letter-spacing:0.08em;">↑ Focus here next week</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1A2E25;">${worstHabit}</p>
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
  weekStart: string,
  weekEnd: string,
  weekLabel: string,
  currentStreak: number,
): Promise<{ sent: boolean; reason?: string }> {
  // Fetch habit_logs for the week
  const { data: logs, error: logsError } = await supabase
    .from('habit_logs')
    .select('date, habit_key, completed')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .eq('completed', true)

  if (logsError) return { sent: false, reason: `logs error: ${logsError.message}` }
  if (!logs || logs.length === 0) return { sent: false, reason: 'no logs this week' }

  // Group by date to get active days
  const dayMap = new Map<string, Set<string>>()
  for (const log of logs) {
    if (!dayMap.has(log.date)) dayMap.set(log.date, new Set())
    dayMap.get(log.date)!.add(log.habit_key)
  }

  const activeDays = dayMap.size
  const totalHabits = logs.length
  const avgHabitsPerDay = activeDays > 0 ? (totalHabits / activeDays).toFixed(1) : '0.0'

  // Best and worst habit (by completion count across the week)
  const habitCounts: Record<string, number> = {}
  for (const key of ALL_HABIT_KEYS) habitCounts[key] = 0
  for (const log of logs) {
    if (habitCounts[log.habit_key] !== undefined) {
      habitCounts[log.habit_key]++
    }
  }

  const sorted = Object.entries(habitCounts)
    .filter(([, count]) => count > 0 || ALL_HABIT_KEYS.includes(Object.keys(habitCounts)[0]))
    .sort(([, a], [, b]) => b - a)

  const bestKey = sorted[0]?.[0] ?? 'wake'
  // Worst = lowest completion among keys that were logged at least once somewhere (so not 0-count keys that user never attempted)
  const loggedKeys = Object.entries(habitCounts).filter(([, c]) => c > 0)
  const worstKey = loggedKeys.length > 1
    ? loggedKeys[loggedKeys.length - 1][0]
    : LIBRARY_HABIT_KEYS.find(k => !loggedKeys.map(([key]) => key).includes(k)) ?? loggedKeys[0]?.[0] ?? 'meditation'

  const bestHabit = HABIT_LABELS[bestKey] ?? bestKey
  const worstHabit = HABIT_LABELS[worstKey] ?? worstKey

  const insight = await aiInsight(firstName, activeDays, totalHabits, bestHabit, worstHabit)

  const html = buildEmailHtml({
    firstName,
    weekLabel,
    activeDays,
    totalHabits,
    avgHabitsPerDay,
    streak: currentStreak,
    bestHabit,
    worstHabit,
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
      subject: `${firstName}, your Niyama week in review 🌿`,
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
  const { weekStart, weekEnd, weekLabel } = getDateRange()

  // Fetch all active users with email + first name + current streak
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, first_name, current_streak, tier, created_at')
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
      weekStart,
      weekEnd,
      weekLabel,
      profile.current_streak ?? 0,
    )
    results.push({ userId: profile.id, email: profile.email, ...result })
  }

  const sent = results.filter(r => r.sent).length
  const skipped = results.filter(r => !r.sent).length

  console.log(`weekly-summary: ${sent} sent, ${skipped} skipped. Week: ${weekStart} → ${weekEnd}`)

  return new Response(
    JSON.stringify({ week: `${weekStart} → ${weekEnd}`, sent, skipped, results }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
