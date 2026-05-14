import { useState } from 'react'
import { supabase } from '../../supabase'

export default function PersonalDetails({ userId, onContinue, onBack }) {
    const [day, setDay] = useState('')
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('')
    const [gender, setGender] = useState('')
    const [region, setRegion] = useState('')
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
    const days = Array.from({ length: 31 }, (_, i) => i + 1)

    function calculateAge(d, m, y) {
        const today = new Date()
        const birth = new Date(y, m - 1, d)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
        return age
    }

    async function handleContinue() {
        if (!day || !month || !year) { setMessage('Please enter your date of birth.'); return }
        if (!gender) { setMessage('Please select your gender.'); return }
        if (!region) { setMessage('Please select your region.'); return }
        const age = calculateAge(parseInt(day), parseInt(month), parseInt(year))
        if (age < 13) { setMessage('Sorry — Niyama is not available for users under 13 years of age.'); return }
        setSaving(true)
        const isMinor = age < 18
        const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        await supabase.from('profiles').update({ gender, date_of_birth: dob, age, is_minor: isMinor, region }).eq('id', userId)
        onContinue(isMinor)
        setSaving(false)
    }

    const selectStyle = {
        width: '100%', background: 'var(--theme-bg)', border: '1px solid var(--theme-border)',
        color: 'var(--theme-text)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none',
    }

    const card = { background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', padding: '32px 24px 96px', maxWidth: '448px', margin: '0 auto' }}>
            {/* Back button */}
            {onBack && (
                <button onClick={onBack} style={{
                    position: 'absolute', top: '24px', left: '24px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '14px', color: 'var(--theme-text-muted)',
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px',
                }}>
                    ← Back
                </button>
            )}

            {/* Progress bar */}
            <ProgressBar step={3} total={9} />

            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--theme-text)' }}>Tell us about yourself</h2>
                <p style={{ fontSize: '13px', color: 'var(--theme-text-secondary)', marginTop: '6px' }}>This helps us personalise your experience</p>
            </div>

            {/* Date of birth */}
            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '4px' }}>Date of birth</h3>
                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '16px' }}>Required to verify eligibility for rewards</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>Day</label>
                        <select value={day} onChange={e => setDay(e.target.value)} style={selectStyle}>
                            <option value="">Day</option>
                            {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>Month</label>
                        <select value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
                            <option value="">Month</option>
                            {months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>Year</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
                            <option value="">Year</option>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Gender */}
            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '4px' }}>Gender</h3>
                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '16px' }}>Helps us understand our users better</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {['Male', 'Female', 'Other', 'Prefer not to say'].map(g => (
                        <button key={g} onClick={() => setGender(g)}
                            style={{
                                padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                                background: gender === g ? 'var(--theme-primary)' : 'var(--theme-bg)',
                                border: gender === g ? '2px solid var(--theme-primary)' : '1px solid var(--theme-border)',
                                color: gender === g ? 'white' : 'var(--theme-text-secondary)',
                            }}>
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* Region */}
            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '4px' }}>Your region</h3>
                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '16px' }}>Used to send rewards in your local currency</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                        { key: 'USA', label: '🇺🇸 United States' },
                        { key: 'India', label: '🇮🇳 India' },
                    ].map(r => (
                        <button key={r.key} onClick={() => setRegion(r.key)}
                            style={{
                                padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.2s',
                                background: region === r.key ? 'var(--theme-primary)' : 'var(--theme-bg)',
                                border: region === r.key ? '2px solid var(--theme-primary)' : '1px solid var(--theme-border)',
                                color: region === r.key ? 'white' : 'var(--theme-text-secondary)',
                            }}>
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {message && (
                <div style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--theme-error)', textAlign: 'center' }}>{message}</p>
                </div>
            )}

            <button onClick={handleContinue} disabled={saving}
                style={{ background: 'var(--theme-primary)', color: 'white', width: '100%', fontWeight: '600', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', border: 'none' }}>
                {saving ? 'Saving...' : 'Continue'}
            </button>
        </div>
    )
}

function ProgressBar({ step, total }) {
    return (
        <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>Step {step} of {total}</span>
                <span style={{ fontSize: '12px', color: 'var(--theme-text-muted)' }}>{Math.round((step / total) * 100)}%</span>
            </div>
            <div style={{ background: 'var(--theme-border)', borderRadius: '4px', height: '4px' }}>
                <div style={{ background: 'var(--theme-primary)', borderRadius: '4px', height: '4px', width: `${(step / total) * 100}%`, transition: 'width 0.3s' }} />
            </div>
        </div>
    )
}
