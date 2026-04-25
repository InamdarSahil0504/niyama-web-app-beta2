import { useState } from 'react'
import { supabase } from '../../supabase'

export default function PersonalDetails({ userId, onContinue }) {
    const [day, setDay] = useState('')
    const [month, setMonth] = useState('')
    const [year, setYear] = useState('')
    const [gender, setGender] = useState('')
    const [theme, setTheme] = useState('')
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

    function handleGenderSelect(g) {
        setGender(g)
        setTheme(g === 'Female' ? 'salmon' : 'sage')
    }

    async function handleContinue() {
        if (!day || !month || !year) { setMessage('Please enter your date of birth.'); return }
        if (!gender) { setMessage('Please select your gender.'); return }
        if (!theme) { setMessage('Please select your preferred theme.'); return }
        const age = calculateAge(parseInt(day), parseInt(month), parseInt(year))
        if (age < 13) { setMessage('Sorry — Niyama is not available for users under 13 years of age.'); return }
        setSaving(true)
        const isMinor = age < 18
        const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        await supabase.from('profiles').update({ gender, date_of_birth: dob, age, is_minor: isMinor, color_theme: theme }).eq('id', userId)
        onContinue(isMinor, theme)
        setSaving(false)
    }

    const selectStyle = {
        width: '100%', background: 'var(--theme-bg)', border: '1px solid var(--theme-border)',
        color: 'var(--theme-text)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', outline: 'none',
    }

    const card = { background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '24px', marginBottom: '16px' }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', padding: '40px 24px 96px', maxWidth: '448px', margin: '0 auto' }}>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--theme-text)' }}>Niyama</h1>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginTop: '12px', color: 'var(--theme-text)' }}>Tell us about yourself</h2>
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
                        <button key={g} onClick={() => handleGenderSelect(g)}
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

            {/* Theme */}
            <div style={card}>
                <h3 style={{ fontWeight: '600', color: 'var(--theme-text)', marginBottom: '4px' }}>Choose your theme</h3>
                <p style={{ fontSize: '12px', color: 'var(--theme-text-muted)', marginBottom: '16px' }}>You can change this anytime in Settings</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                    {/* Sage */}
                    <button onClick={() => setTheme('sage')}
                        style={{ borderRadius: '12px', overflow: 'hidden', border: theme === 'sage' ? '2px solid var(--theme-primary)' : '1px solid var(--theme-border)', cursor: 'pointer', background: 'none' }}>
                        <div style={{ background: '#F4F7F5', padding: '12px' }}>
                            <div style={{ background: '#5A8A78', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
                                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}></div>
                                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.4)', width: '75%' }}></div>
                            </div>
                            <div style={{ background: '#FFFFFF', border: '1px solid #D9E5DF', borderRadius: '8px', padding: '8px' }}>
                                <div style={{ height: '6px', borderRadius: '3px', background: '#5A8A78', width: '60%', marginBottom: '4px' }}></div>
                                <div style={{ height: '6px', borderRadius: '3px', background: '#5A8A78', width: '80%', marginBottom: '8px' }}></div>
                                <div style={{ height: '20px', borderRadius: '6px', background: '#D4735F' }}></div>
                            </div>
                        </div>
                        <div style={{ background: '#F4F7F5', borderTop: '1px solid #D9E5DF', padding: '8px' }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', textAlign: 'center', color: '#1A1A1A', margin: 0 }}>Sage</p>
                            <p style={{ fontSize: '11px', textAlign: 'center', color: '#6B7280', margin: 0 }}>Green dominant</p>
                        </div>
                    </button>

                    {/* Salmon */}
                    <button onClick={() => setTheme('salmon')}
                        style={{ borderRadius: '12px', overflow: 'hidden', border: theme === 'salmon' ? '2px solid var(--theme-secondary)' : '1px solid var(--theme-border)', cursor: 'pointer', background: 'none' }}>
                        <div style={{ background: '#F7F4F4', padding: '12px' }}>
                            <div style={{ background: '#D4735F', borderRadius: '8px', padding: '8px', marginBottom: '8px' }}>
                                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}></div>
                                <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.4)', width: '75%' }}></div>
                            </div>
                            <div style={{ background: '#FFFFFF', border: '1px solid #E5D9D5', borderRadius: '8px', padding: '8px' }}>
                                <div style={{ height: '6px', borderRadius: '3px', background: '#D4735F', width: '60%', marginBottom: '4px' }}></div>
                                <div style={{ height: '6px', borderRadius: '3px', background: '#D4735F', width: '80%', marginBottom: '8px' }}></div>
                                <div style={{ height: '20px', borderRadius: '6px', background: '#5A8A78' }}></div>
                            </div>
                        </div>
                        <div style={{ background: '#F7F4F4', borderTop: '1px solid #E5D9D5', padding: '8px' }}>
                            <p style={{ fontSize: '13px', fontWeight: '500', textAlign: 'center', color: '#1A1A1A', margin: 0 }}>Salmon</p>
                            <p style={{ fontSize: '11px', textAlign: 'center', color: '#6B7280', margin: 0 }}>Pink dominant</p>
                        </div>
                    </button>

                </div>
            </div>

            {message && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                    <p style={{ fontSize: '14px', color: '#dc2626', textAlign: 'center' }}>{message}</p>
                </div>
            )}

            <button onClick={handleContinue} disabled={saving}
                style={{ background: 'var(--theme-primary)', color: 'white', width: '100%', fontWeight: '600', padding: '14px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Continue'}
            </button>

        </div>
    )
}