import { useState } from 'react'
import { supabase } from '../supabase'

export default function ResetPassword() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [isSuccess, setIsSuccess] = useState(false)

    async function handleReset() {
        if (!password || !confirmPassword) { setMessage('Please fill in both fields.'); return }
        if (password !== confirmPassword) { setMessage('Passwords do not match.'); return }
        if (password.length < 6) { setMessage('Password must be at least 6 characters.'); return }
        setLoading(true)
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
            setMessage(error.message)
        } else {
            setIsSuccess(true)
            setMessage('Password updated successfully! Redirecting...')
            setTimeout(() => { window.location.href = '/' }, 2000)
        }
        setLoading(false)
    }

    const inputStyle = {
        background: 'var(--theme-bg)',
        border: '1px solid var(--theme-border)',
        color: 'var(--theme-text)',
        width: '100%',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        outline: 'none',
        boxSizing: 'border-box',
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            <div style={{ width: '100%', maxWidth: '448px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '36px', fontWeight: '700', color: 'var(--theme-text)', letterSpacing: '-0.02em' }}>Niyama</h1>
                    <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', marginTop: '8px' }}>Set your new password</p>
                </div>

                {/* Card */}
                <div style={{ background: 'var(--theme-card)', border: '1px solid var(--theme-border)', borderRadius: '16px', padding: '32px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--theme-text)', marginBottom: '24px' }}>Create new password</h2>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>New password</label>
                        <input type="password" placeholder="••••••••" value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleReset()}
                            style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ fontSize: '14px', color: 'var(--theme-text-secondary)', display: 'block', marginBottom: '4px' }}>Confirm new password</label>
                        <input type="password" placeholder="••••••••" value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleReset()}
                            style={inputStyle} />
                    </div>

                    {message && (
                        <p style={{ fontSize: '14px', color: isSuccess ? 'var(--theme-primary)' : '#dc2626', marginBottom: '16px' }}>
                            {message}
                        </p>
                    )}

                    <button onClick={handleReset} disabled={loading || isSuccess}
                        style={{
                            background: isSuccess ? 'var(--theme-primary-light)' : 'var(--theme-primary)',
                            color: isSuccess ? 'var(--theme-primary)' : 'white',
                            width: '100%', fontWeight: '600', padding: '12px',
                            borderRadius: '8px', fontSize: '15px',
                            cursor: loading || isSuccess ? 'default' : 'pointer',
                            border: 'none', opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s',
                        }}>
                        {loading ? 'Updating...' : isSuccess ? 'Redirecting...' : 'Update password'}
                    </button>
                </div>

            </div>
        </div>
    )
}