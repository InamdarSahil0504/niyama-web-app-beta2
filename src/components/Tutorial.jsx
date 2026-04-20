import { useState, useEffect } from 'react'

const STEPS = [
    {
        target: 'streak',
        title: '🔥 Your streak',
        message: 'This tracks your consecutive successful days. A successful day means completing any 4 of your 5 daily habits. Keep the flame alive — miss a day and it resets to zero!',
    },
    {
        target: 'eligibility',
        title: '🎯 Reward eligibility',
        message: 'This bar shows your progress towards qualifying for a reward this month. The minimum successful days depends on your plan — Basic: 10 days, Plus: 7 days, Premium: 5 days.',
    },
    {
        target: 'habits',
        title: '✅ Your daily habits',
        message: 'Check off each of the 5 science-backed habits you complete today. Save a draft during the day and submit your final results before midnight. Screen time is a flex habit — no penalty if you miss it.',
    },
    {
        target: 'stats',
        title: '📊 Your stats',
        message: 'Track your monthly points and successful days here. Your points convert to real rewards at 1,000 points = $1.00, subject to your tier cap.',
    },
    {
        target: 'rewards',
        title: '🎁 Your rewards',
        message: 'See your estimated reward and how close you are to your tier cap. Upgrade your plan to unlock higher reward caps and qualify with fewer successful days.',
    },
    {
        target: 'nav',
        title: '🗺️ Navigate the app',
        message: 'Use the tabs at the bottom to explore Analytics, Rewards and Settings. You can replay this tour anytime from Settings → Getting started.',
    },
]

const targetMap = {
    streak: 'streak',
    eligibility: 'eligibility',
    habits: 'habits',
    stats: 'stats',
    rewards: 'rewards-summary',
    nav: 'bottom-nav',
}

export default function Tutorial({ onComplete }) {
    const [step, setStep] = useState(0)
    const current = STEPS[step]
    const isLast = step === STEPS.length - 1

    useEffect(() => {
        const timer = setTimeout(() => {
            document.querySelectorAll('[data-tutorial]').forEach(el => {
                el.style.outline = 'none'
                el.style.outlineOffset = 'unset'
                el.style.boxShadow = 'none'
            })
            const target = document.querySelector(`[data-tutorial="${targetMap[current.target]}"]`)
            if (target) {
                target.style.outline = '3px solid #D4735F'
                target.style.outlineOffset = '3px'
                target.style.boxShadow = '0 0 0 6px rgba(212,115,95,0.15)'
                target.style.borderRadius = '16px'
                target.style.transition = 'all 0.3s'
                if (targetMap[current.target] === 'bottom-nav') {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                } else {
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
            }
        }, 150)

        return () => {
            clearTimeout(timer)
            document.querySelectorAll('[data-tutorial]').forEach(el => {
                el.style.outline = 'none'
                el.style.boxShadow = 'none'
            })
        }
    }, [step])

    function handleNext() {
        if (isLast) {
            document.querySelectorAll('[data-tutorial]').forEach(el => {
                el.style.outline = 'none'
                el.style.boxShadow = 'none'
            })
            onComplete()
        } else {
            setStep(step + 1)
        }
    }

    function handleBack() {
        if (step > 0) setStep(step - 1)
    }

    function handleSkip() {
        document.querySelectorAll('[data-tutorial]').forEach(el => {
            el.style.outline = 'none'
            el.style.boxShadow = 'none'
        })
        onComplete()
    }

    return (
        <>
            {/* Semi-transparent backdrop */}
            <div style={{
                position: 'fixed', inset: 0, zIndex: 998,
                pointerEvents: 'none',
                background: 'rgba(0,0,0,0.15)',
            }} />

            {/* Bottom sheet tooltip */}
            <div style={{
                position: 'fixed', bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '448px',
                zIndex: 999,
                padding: '0 16px 16px',
            }}>
                <div style={{
                    background: 'var(--theme-card)',
                    borderRadius: '20px 20px 16px 16px',
                    padding: '20px',
                    border: '1px solid var(--theme-border)',
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
                }}>

                    {/* Progress dots */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', justifyContent: 'center' }}>
                        {STEPS.map((_, i) => (
                            <div key={i} style={{
                                height: '4px',
                                borderRadius: '2px',
                                flex: i === step ? '2' : '1',
                                background: i <= step ? 'var(--theme-primary)' : 'var(--theme-border)',
                                transition: 'all 0.3s',
                            }} />
                        ))}
                    </div>

                    {/* Step indicator */}
                    <p style={{ fontSize: '11px', color: 'var(--theme-text-muted)', marginBottom: '6px', textAlign: 'center' }}>
                        Step {step + 1} of {STEPS.length}
                    </p>

                    {/* Title */}
                    <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--theme-text)', marginBottom: '8px' }}>
                        {current.title}
                    </p>

                    {/* Message */}
                    <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', lineHeight: '1.6', marginBottom: '16px' }}>
                        {current.message}
                    </p>

                    {/* Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={handleSkip} style={{ fontSize: '13px', color: 'var(--theme-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            Skip tour
                        </button>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {step > 0 && (
                                <button onClick={handleBack} style={{ background: 'var(--theme-bg)', border: '1px solid var(--theme-border)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', color: 'var(--theme-text-secondary)', cursor: 'pointer' }}>
                                    Back
                                </button>
                            )}
                            <button onClick={handleNext} style={{ background: 'var(--theme-primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 20px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                                {isLast ? 'Got it!' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}