import { useState } from 'react'
import { supabase } from '../supabase'

export default function Auth() {
  const [screen, setScreen]     = useState('welcome')  // 'welcome' | 'signup' | 'login' | 'otp'
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')
  const [isNewUser, setIsNewUser] = useState(false)

  // ── Send OTP ────────────────────────────────────────────────────────────────
  async function sendOTP(mode) {
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address.')
      return
    }
    setLoading(true)
    setMessage('')

    if (mode === 'signup') {
      // Check if user already exists
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('email', email).single()
      if (existing) {
        setMessage('An account with this email already exists. Please log in instead.')
        setLoading(false)
        return
      }
      setIsNewUser(true)
    } else {
      setIsNewUser(false)
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === 'signup',
        emailRedirectTo: window.location.origin,
      }
    })

    if (error) {
      setMessage(error.message)
    } else {
      setScreen('otp')
      setMessage('')
    }
    setLoading(false)
  }

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  async function verifyOTP() {
    if (!otp || otp.length < 6) {
      setMessage('Please enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      setMessage('Invalid or expired code. Please try again.')
      setLoading(false)
      return
    }

    // If new user — create profile and streaks row
    if (data.user && isNewUser) {
      const { data: existingProfile } = await supabase
        .from('profiles').select('id').eq('id', data.user.id).single()

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          tier: 'free',
          monthly_points: 0,
          onboarding_complete: false,
        })
        await supabase.from('streaks').insert({
          user_id: data.user.id,
          current_streak: 0,
          longest_streak: 0,
        })
      }
    }
    // Auth state change in App.jsx will handle the redirect to Dashboard
    setLoading(false)
  }

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  async function resendOTP() {
    setMessage('')
    setOtp('')
    await sendOTP(isNewUser ? 'signup' : 'login')
  }

  const inputStyle = {
    background: 'var(--theme-bg)',
    border: '1px solid var(--theme-border)',
    color: 'var(--theme-text)',
    width: '100%',
    borderRadius: '10px',
    padding: '14px 16px',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const btnPrimary = {
    background: 'var(--theme-primary)',
    color: 'white',
    width: '100%',
    fontWeight: '700',
    padding: '14px',
    borderRadius: '10px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '15px',
    border: 'none',
    opacity: loading ? 0.7 : 1,
    marginTop: '8px',
  }

  const btnGhost = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--theme-text-secondary)',
    padding: '8px 0',
    width: '100%',
  }

  // ── Screen 1: Welcome ───────────────────────────────────────────────────────
  if (screen === 'welcome') return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px', textAlign:'center' }}>

        {/* Logo */}
        <div style={{ marginBottom:'48px' }}>
          <div style={{ width:'72px', height:'72px', background:'var(--theme-primary)', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <span style={{ fontSize:'36px' }}>🌿</span>
          </div>
          <h1 style={{ fontSize:'40px', fontWeight:'800', color:'var(--theme-text)', letterSpacing:'-0.03em', marginBottom:'8px' }}>
            Niyama Life
          </h1>
          <p style={{ fontSize:'16px', color:'var(--theme-text-secondary)', lineHeight:'1.5' }}>
            Rewarding Discipline.
          </p>
        </div>

        {/* Value props */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'48px', textAlign:'left' }}>
          {[
            { icon:'🔬', text:'5 science-backed habits, tracked daily' },
            { icon:'🔥', text:'Build streaks and earn real financial rewards' },
            { icon:'📊', text:'Your data stays yours — no ads, ever' },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', background:'var(--theme-card)', border:'1px solid var(--theme-border)', borderRadius:'12px', padding:'14px 16px' }}>
              <span style={{ fontSize:'20px', flexShrink:0 }}>{item.icon}</span>
              <p style={{ fontSize:'14px', color:'var(--theme-text)', lineHeight:'1.4' }}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <button onClick={() => setScreen('signup')} style={{ ...btnPrimary, marginBottom:'12px' }}>
          Get started — it's free
        </button>
        <button onClick={() => setScreen('login')} style={btnGhost}>
          I already have an account
        </button>

        <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', marginTop:'24px', lineHeight:'1.6' }}>
          Beta testing version · No fees charged · No rewards paid out yet
        </p>
      </div>
    </div>
  )

  // ── Screen 2a: Sign up ──────────────────────────────────────────────────────
  if (screen === 'signup') return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>

        <button onClick={() => { setScreen('welcome'); setMessage('') }} style={{ ...btnGhost, width:'auto', marginBottom:'24px', display:'flex', alignItems:'center', gap:'6px', color:'var(--theme-text-muted)' }}>
          ← Back
        </button>

        <h2 style={{ fontSize:'28px', fontWeight:'800', color:'var(--theme-text)', marginBottom:'8px', letterSpacing:'-0.02em' }}>
          Create your account
        </h2>
        <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)', marginBottom:'32px', lineHeight:'1.5' }}>
          We'll send a one-time code to your email — no password needed.
        </p>

        <div style={{ marginBottom:'16px' }}>
          <label style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text-secondary)', display:'block', marginBottom:'6px' }}>
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendOTP('signup')}
            style={inputStyle}
            autoFocus
          />
        </div>

        {message && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
            <p style={{ fontSize:'13px', color:'#dc2626' }}>{message}</p>
          </div>
        )}

        <button onClick={() => sendOTP('signup')} disabled={loading} style={btnPrimary}>
          {loading ? 'Sending code...' : 'Send verification code →'}
        </button>

        <div style={{ textAlign:'center', marginTop:'24px' }}>
          <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)' }}>
            Already have an account?{' '}
            <button onClick={() => { setScreen('login'); setMessage('') }}
              style={{ fontWeight:'700', color:'var(--theme-primary)', background:'none', border:'none', cursor:'pointer' }}>
              Log in
            </button>
          </p>
        </div>

        <div style={{ borderTop:'1px solid var(--theme-border)', marginTop:'32px', paddingTop:'16px' }}>
          <p style={{ fontSize:'11px', color:'var(--theme-text-muted)', lineHeight:'1.6', textAlign:'center' }}>
            By signing up you agree to our{' '}
            <span style={{ color:'var(--theme-primary)', textDecoration:'underline', cursor:'pointer' }}
              onClick={() => window.open('https://niyamalife.com/terms', '_blank')}>
              Terms of Service
            </span>{' '}and{' '}
            <span style={{ color:'var(--theme-primary)', textDecoration:'underline', cursor:'pointer' }}
              onClick={() => window.open('https://niyamalife.com/privacy', '_blank')}>
              Privacy Policy
            </span>.
          </p>
        </div>
      </div>
    </div>
  )

  // ── Screen 2b: Log in ───────────────────────────────────────────────────────
  if (screen === 'login') return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>

        <button onClick={() => { setScreen('welcome'); setMessage('') }} style={{ ...btnGhost, width:'auto', marginBottom:'24px', display:'flex', alignItems:'center', gap:'6px', color:'var(--theme-text-muted)' }}>
          ← Back
        </button>

        <h2 style={{ fontSize:'28px', fontWeight:'800', color:'var(--theme-text)', marginBottom:'8px', letterSpacing:'-0.02em' }}>
          Welcome back
        </h2>
        <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)', marginBottom:'32px', lineHeight:'1.5' }}>
          Enter your email and we'll send you a sign-in code.
        </p>

        <div style={{ marginBottom:'16px' }}>
          <label style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text-secondary)', display:'block', marginBottom:'6px' }}>
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendOTP('login')}
            style={inputStyle}
            autoFocus
          />
        </div>

        {message && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
            <p style={{ fontSize:'13px', color:'#dc2626' }}>{message}</p>
          </div>
        )}

        <button onClick={() => sendOTP('login')} disabled={loading} style={btnPrimary}>
          {loading ? 'Sending code...' : 'Send sign-in code →'}
        </button>

        <div style={{ textAlign:'center', marginTop:'24px' }}>
          <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)' }}>
            Don't have an account?{' '}
            <button onClick={() => { setScreen('signup'); setMessage('') }}
              style={{ fontWeight:'700', color:'var(--theme-primary)', background:'none', border:'none', cursor:'pointer' }}>
              Sign up free
            </button>
          </p>
        </div>
      </div>
    </div>
  )

  // ── Screen 2c: OTP verification ─────────────────────────────────────────────
  if (screen === 'otp') return (
    <div style={{ minHeight:'100vh', background:'var(--theme-bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 24px' }}>
      <div style={{ width:'100%', maxWidth:'400px' }}>

        <button onClick={() => { setScreen(isNewUser ? 'signup' : 'login'); setMessage(''); setOtp('') }}
          style={{ ...btnGhost, width:'auto', marginBottom:'24px', display:'flex', alignItems:'center', gap:'6px', color:'var(--theme-text-muted)' }}>
          ← Back
        </button>

        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ width:'56px', height:'56px', background:'var(--theme-primary-light)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
            <span style={{ fontSize:'28px' }}>📬</span>
          </div>
          <h2 style={{ fontSize:'28px', fontWeight:'800', color:'var(--theme-text)', marginBottom:'8px', letterSpacing:'-0.02em' }}>
            Check your email
          </h2>
          <p style={{ fontSize:'14px', color:'var(--theme-text-secondary)', lineHeight:'1.6' }}>
            We sent a 6-digit code to<br />
            <strong style={{ color:'var(--theme-text)' }}>{email}</strong>
          </p>
        </div>

        <div style={{ marginBottom:'16px' }}>
          <label style={{ fontSize:'13px', fontWeight:'600', color:'var(--theme-text-secondary)', display:'block', marginBottom:'6px' }}>
            Verification code
          </label>
          <input
            type="number"
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && verifyOTP()}
            style={{ ...inputStyle, fontSize:'24px', fontWeight:'700', letterSpacing:'0.2em', textAlign:'center' }}
            autoFocus
          />
        </div>

        {message && (
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:'8px', padding:'10px 14px', marginBottom:'16px' }}>
            <p style={{ fontSize:'13px', color:'#dc2626' }}>{message}</p>
          </div>
        )}

        <button onClick={verifyOTP} disabled={loading} style={btnPrimary}>
          {loading ? 'Verifying...' : 'Verify and continue →'}
        </button>

        <div style={{ textAlign:'center', marginTop:'20px' }}>
          <p style={{ fontSize:'13px', color:'var(--theme-text-muted)', marginBottom:'8px' }}>
            Didn't receive it? Check your spam folder.
          </p>
          <button onClick={resendOTP} disabled={loading}
            style={{ fontSize:'13px', color:'var(--theme-primary)', fontWeight:'600', background:'none', border:'none', cursor:'pointer' }}>
            Resend code
          </button>
        </div>
      </div>
    </div>
  )

  return null
}
