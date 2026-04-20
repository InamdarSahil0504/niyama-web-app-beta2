import { useState } from 'react'
import { supabase } from '../supabase'

// ─── VERSION HISTORY ──────────────────────────────────────────────────────────
// Add new versions at the TOP of this array.
// Bump CURRENT_VERSION in Dashboard.jsx to trigger the update screen for all users.
export const CURRENT_VERSION = '1.1.0'

export const VERSION_HISTORY = [
    {
        version: '1.1.0',
        date: 'April 2026',
        title: 'Rewards redesign + notification improvements',
        updates: [
            {
                emoji: '🆓',
                title: 'Free tier redesigned',
                detail: 'Free users now earn up to $2.50/month for their first 3 months, provided they meet the eligibility requirement of 10 successful days. After 3 months, the app remains free forever with full access — habit tracking, streaks, and analytics — with no rewards unless you upgrade to Basic.',
            },
            {
                emoji: '🏆',
                title: 'Premium perfect month bonus',
                detail: 'The 25-day streak bonus has been replaced with a Perfect Month bonus. If every single day in the month is a successful day (any 4 of 5 habits), your Premium reward increases from $20 to $30. Earn up to $30/month.',
            },
            {
                emoji: '🔔',
                title: 'Notification preferences',
                detail: 'Push notifications and email reminders can now be managed at any time from Settings → Notification preferences. Enable push notifications to receive daily reminders at 2:30 PM and 9:00 PM on days you haven\'t submitted yet.',
            },
            {
                emoji: '🛡',
                title: 'Security and stability improvements',
                detail: 'Various under-the-hood improvements to data handling, admin tooling, and app performance.',
            },
        ],
    },
    {
        version: '1.0.0',
        date: 'March 2026',
        title: 'Initial beta launch',
        updates: [
            {
                emoji: '🌿',
                title: 'Niyama Life Beta 1 launched',
                detail: 'Five science-backed daily habits, points system, streak tracking, tier selection, analytics calendar, rewards tracking, and contact support.',
            },
        ],
    },
]

// ─── APP UPDATE PAGE ──────────────────────────────────────────────────────────
export default function AppUpdate({ userId, onComplete }) {
    const [acknowledging, setAcknowledging] = useState(false)
    const currentUpdate = VERSION_HISTORY[0]

    async function handleAcknowledge() {
        setAcknowledging(true)
        await supabase.from('profiles')
            .update({ last_acknowledged_version: CURRENT_VERSION })
            .eq('id', userId)
        onComplete()
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--theme-bg)',
            color: 'var(--theme-text)',
            padding: '40px 16px 96px',
        }}>
            <div style={{ maxWidth: '448px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '56px', height: '56px',
                        background: 'var(--theme-primary)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '26px', margin: '0 auto 16px',
                    }}>
                        🌿
                    </div>
                    <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--theme-text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Niyama Life
                    </p>
                    <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>
                        What's new in {currentUpdate.version}
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>
                        {currentUpdate.title}
                    </p>
                </div>

                {/* Update items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    {currentUpdate.updates.map((item, i) => (
                        <div key={i} style={{
                            background: 'var(--theme-card)',
                            border: '1px solid var(--theme-border)',
                            borderRadius: '16px',
                            padding: '18px 20px',
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'flex-start',
                        }}>
                            <div style={{
                                width: '40px', height: '40px',
                                background: 'var(--theme-primary-light)',
                                borderRadius: '10px',
                                display: 'flex', alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px', flexShrink: 0,
                            }}>
                                {item.emoji}
                            </div>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '6px' }}>
                                    {item.title}
                                </p>
                                <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>
                                    {item.detail}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Beta notice */}
                <div style={{
                    background: '#fffbeb',
                    border: '1px solid #fcd34d',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '24px',
                }}>
                    <p style={{ fontSize: '13px', color: '#92400e', lineHeight: '1.6' }}>
                        🧪 <strong>Beta reminder:</strong> No subscription fees are charged and no monetary rewards are paid out during beta. All features are fully functional for testing.
                    </p>
                </div>

                {/* Acknowledge button */}
                <button
                    onClick={handleAcknowledge}
                    disabled={acknowledging}
                    style={{
                        width: '100%',
                        background: 'var(--theme-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '16px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: acknowledging ? 'not-allowed' : 'pointer',
                        opacity: acknowledging ? 0.7 : 1,
                        transition: 'opacity 0.2s',
                    }}>
                    {acknowledging ? 'One moment...' : "Got it — let's go 🌿"}
                </button>

                <p style={{
                    fontSize: '12px',
                    color: 'var(--theme-text-muted)',
                    textAlign: 'center',
                    marginTop: '16px',
                }}>
                    Version {CURRENT_VERSION} · {currentUpdate.date}
                </p>

            </div>
        </div>
    )
}

// ─── APP UPDATES SETTINGS PAGE ────────────────────────────────────────────────
// Used in Settings.jsx to show the full version history
export function AppUpdatesPage({ onBack }) {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--theme-bg)',
            color: 'var(--theme-text)',
            padding: '32px 16px',
            maxWidth: '448px',
            margin: '0 auto',
            paddingBottom: '96px',
        }}>
            <button
                onClick={onBack}
                style={{
                    fontSize: '14px', color: 'var(--theme-primary)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px',
                }}>
                ← Back
            </button>

            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '6px' }}>
                App updates
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginBottom: '28px' }}>
                A full history of everything that's changed in Niyama Life.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {VERSION_HISTORY.map((release, ri) => (
                    <div key={release.version}>
                        {/* Version header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <div style={{
                                background: ri === 0 ? 'var(--theme-primary)' : 'var(--theme-primary-light)',
                                color: ri === 0 ? 'white' : 'var(--theme-primary)',
                                fontSize: '12px', fontWeight: '700',
                                padding: '3px 10px', borderRadius: '20px',
                            }}>
                                v{release.version}
                            </div>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)' }}>
                                {release.title}
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
                                {release.date}
                            </p>
                        </div>

                        {/* Update items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {release.updates.map((item, i) => (
                                <div key={i} style={{
                                    background: 'var(--theme-card)',
                                    border: '1px solid var(--theme-border)',
                                    borderRadius: '12px',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'flex-start',
                                }}>
                                    <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{item.emoji}</span>
                                    <div>
                                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '4px' }}>
                                            {item.title}
                                        </p>
                                        <p style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', lineHeight: '1.6' }}>
                                            {item.detail}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <p style={{
                fontSize: '12px',
                color: 'var(--theme-text-muted)',
                textAlign: 'center',
                marginTop: '32px',
            }}>
                Current version: {CURRENT_VERSION}
            </p>
        </div>
    )
}
