import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

// ─── Design tokens — mirrors niyama-mobile-rebuild/src/theme.js ───────────────
const t = {
  bg:            'var(--theme-bg)',
  card:          'var(--theme-card)',
  border:        'var(--theme-border)',
  primary:       'var(--theme-primary)',
  primaryLight:  '#E8F0EC',
  text:          'var(--theme-text)',
  textSecondary: 'var(--theme-text-secondary)',
  textMuted:     'var(--theme-text-muted)',
  error:         'var(--theme-error)',
}

const RESEND_COOLDOWN = 30

// ─── Shared sub-components ────────────────────────────────────────────────────

function Screen({ children }) {
  return (
    <div style={{
      minHeight: '100dvh', background: t.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '448px', flex: 1, display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
        {children}
      </div>
    </div>
  )
}

function BackBtn({ onPress }) {
  return (
    <button
      onClick={onPress}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '15px', color: t.primary, fontWeight: '500',
        padding: '20px 0 0', alignSelf: 'flex-start', letterSpacing: '-0.01em',
      }}
    >
      ← Back
    </button>
  )
}

function FieldLabel({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: '11px', fontWeight: '600',
      color: t.textSecondary, marginBottom: '6px',
      textTransform: 'uppercase', letterSpacing: '0.08em',
    }}>
      {children}
    </label>
  )
}

function Input({ style, ...props }) {
  return (
    <input
      style={{
        width: '100%', boxSizing: 'border-box',
        background: t.card, border: `1px solid ${t.border}`,
        borderRadius: '8px', padding: '14px 16px',
        fontSize: '14px', color: t.text,
        outline: 'none', fontFamily: 'inherit',
        ...style,
      }}
      {...props}
    />
  )
}

function Field({ label, style, ...inputProps }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <FieldLabel>{label}</FieldLabel>
      <Input style={style} {...inputProps} />
    </div>
  )
}

function BtnPrimary({ children, loading, disabled, onClick, style }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%', background: t.primary, color: '#FFFFFF',
        border: 'none', borderRadius: '12px',
        padding: '16px', fontSize: '16px', fontWeight: '700',
        cursor: loading || disabled ? 'default' : 'pointer',
        opacity: loading || disabled ? 0.6 : 1,
        fontFamily: 'inherit', letterSpacing: '-0.01em',
        transition: 'opacity 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div style={{
      background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.25)',
      borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
    }}>
      <p style={{ fontSize: '13px', color: t.error, margin: 0, lineHeight: '1.5' }}>{message}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Auth() {
  const [screen, setScreen]                   = useState('welcome')
  const [email, setEmail]                     = useState('')
  const [fullName, setFullName]               = useState('')
  const [phone, setPhone]                     = useState('')
  const [password, setPassword]               = useState('')
  const [usePassword, setUsePassword]         = useState(false) // login screen toggle
  const [loading, setLoading]                 = useState(false)
  const [message, setMessage]                 = useState('')
  const [isNewUser, setIsNewUser]             = useState(false)

  // OTP digit boxes
  const [digits, setDigits]                   = useState(Array(6).fill(''))
  const [resendCooldown, setResendCooldown]   = useState(0)
  const [resending, setResending]             = useState(false)
  const digitRefs                             = useRef([])

  // Resend countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(v => v - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  function goToScreen(s) { setScreen(s); setMessage('') }

  // ── Send OTP ───────────────────────────────────────────────────────────────
  async function sendOTP(mode) {
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address.')
      return
    }
    if (mode === 'signup' && !fullName.trim()) {
      setMessage('Please enter your full name.')
      return
    }
    setLoading(true)
    setMessage('')

    if (mode === 'signup') {
      const { data: existing } = await supabase
        .from('profiles').select('id').eq('email', email).maybeSingle()
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
      options: { shouldCreateUser: mode === 'signup' },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setDigits(Array(6).fill(''))
      setResendCooldown(RESEND_COOLDOWN)
      setScreen('otp')
      setMessage('')
      setTimeout(() => digitRefs.current[0]?.focus(), 100)
    }
    setLoading(false)
  }

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  async function verifyOTP(codeOverride) {
    const fullCode = codeOverride ?? digits.join('')
    if (fullCode.length < 6) {
      setMessage('Please enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    setMessage('')

    const { data, error } = await supabase.auth.verifyOtp({
      email, token: fullCode, type: 'email',
    })

    if (error) {
      setMessage('Invalid or expired code. Please try again.')
      setDigits(Array(6).fill(''))
      setTimeout(() => digitRefs.current[0]?.focus(), 50)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profileCheck } = await supabase
        .from('profiles').select('deleted_at').eq('id', data.user.id).maybeSingle()
      if (profileCheck?.deleted_at) {
        await supabase.auth.signOut()
        setMessage('This account is scheduled for deletion. To restore it, contact support@niyamalife.com')
        setLoading(false)
        return
      }
    }

    if (data.user && isNewUser) {
      await supabase.from('profiles').upsert({
        id: data.user.id, email,
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        tier: 'free', monthly_points: 0, onboarding_complete: false,
        research_consent: true, research_consent_at: new Date().toISOString(),
      }, { onConflict: 'id' })

      const { data: existingStreak } = await supabase
        .from('streaks').select('id').eq('user_id', data.user.id).maybeSingle()
      if (!existingStreak) {
        await supabase.from('streaks').insert({
          user_id: data.user.id, current_streak: 0, longest_streak: 0,
        })
      }
      window.posthog?.identify(data.user.id)
      window.posthog?.capture('signed_up', { method: 'otp' })
    } else if (data.user) {
      window.posthog?.identify(data.user.id)
      window.posthog?.capture('logged_in', { method: 'otp' })
    }
    setLoading(false)
  }

  // ── Password login (Beta 1 accounts) ──────────────────────────────────────
  async function handlePasswordLogin() {
    if (!email || !password) {
      setMessage('Please enter your email and password.')
      return
    }
    setLoading(true)
    setMessage('')
    const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage(error.message)
    } else if (loginData.user) {
      const { data: profileCheck } = await supabase
        .from('profiles').select('deleted_at').eq('id', loginData.user.id).maybeSingle()
      if (profileCheck?.deleted_at) {
        await supabase.auth.signOut()
        setMessage('This account is scheduled for deletion. To restore it, contact support@niyamalife.com')
        setLoading(false)
        return
      }
      window.posthog?.identify(loginData.user.id)
      window.posthog?.capture('logged_in', { method: 'password' })
    }
    setLoading(false)
  }

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  async function resendOTP() {
    if (resendCooldown > 0) return
    setResending(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) {
      setMessage('Could not resend — ' + error.message)
    } else {
      setDigits(Array(6).fill(''))
      setResendCooldown(RESEND_COOLDOWN)
      setTimeout(() => digitRefs.current[0]?.focus(), 50)
    }
    setResending(false)
  }

  // ── OTP digit helpers ──────────────────────────────────────────────────────
  function handleDigitChange(text, index) {
    const digit = text.replace(/[^0-9]/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)

    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus()
    }
    // Auto-submit on last digit
    if (digit && index === 5) {
      const code = next.join('')
      if (code.length === 6) verifyOTP(code)
    }
  }

  function handleDigitKeyDown(e, index) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus()
    }
  }

  function handleDigitPaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (pasted.length === 0) return
    const next = Array(6).fill('')
    pasted.split('').forEach((d, i) => { next[i] = d })
    setDigits(next)
    const lastIndex = Math.min(pasted.length - 1, 5)
    digitRefs.current[lastIndex]?.focus()
    if (pasted.length === 6) verifyOTP(pasted)
  }

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: Welcome
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === 'welcome') return (
    <div style={{
      minHeight: '100dvh', background: t.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
    }}>
      <div style={{
        width: '100%', maxWidth: '448px', flex: 1,
        display: 'flex', flexDirection: 'column',
        padding: '0 24px 40px',
        justifyContent: 'space-between',
      }}>

        {/* Logo + tagline — centered together as one unit */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src="/niyama-icon.svg" alt="Niyama Life"
              style={{ width: '80px', height: '80px', borderRadius: '20px', display: 'block', margin: '0 auto 20px' }}
            />
            <h1 style={{
              fontSize: '36px', fontWeight: '800', color: t.text,
              letterSpacing: '-0.03em', margin: '0 0 32px',
            }}>
              Niyama
            </h1>
            {['Daily discipline.', 'Backed by science.', 'Rewarded financially.'].map(line => (
              <p key={line} style={{
                fontSize: '16px', fontWeight: '500', color: t.textSecondary,
                lineHeight: '28px', margin: 0,
              }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <BtnPrimary onClick={() => goToScreen('signup')}>Sign Up</BtnPrimary>

          {/* Outlined Log In */}
          <button
            onClick={() => goToScreen('login')}
            style={{
              width: '100%', background: 'none',
              border: `1.5px solid ${t.primary}`, borderRadius: '12px',
              padding: '16px', fontSize: '16px', fontWeight: '700',
              color: t.primary, cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '-0.01em', transition: 'opacity 0.15s',
            }}
          >
            Log In
          </button>
        </div>

      </div>
    </div>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: Sign Up
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === 'signup') return (
    <Screen>
      <BackBtn onPress={() => goToScreen('welcome')} />

      <div style={{ paddingTop: '28px', flex: 1 }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: t.text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Create your account
        </h2>
        <p style={{ fontSize: '14px', color: t.textSecondary, marginBottom: '32px', lineHeight: '1.6' }}>
          Join Niyama Life and start building daily discipline.
        </p>

        <Field label="Full name" type="text" placeholder="Your full name"
          value={fullName} onChange={e => setFullName(e.target.value)} autoFocus />

        <Field label="Email address" type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendOTP('signup')} />

        <Field label="Phone number" type="tel" placeholder="+1 (555) 000-0000"
          value={phone} onChange={e => setPhone(e.target.value)} />
        <p style={{ fontSize: '11px', color: t.textMuted, marginTop: '-10px', marginBottom: '16px' }}>
          Optional — used for account recovery only.
        </p>

        <ErrorBox message={message} />

        <BtnPrimary onClick={() => sendOTP('signup')} loading={loading} style={{ marginBottom: '20px' }}>
          {loading ? 'Sending code…' : 'Create Account'}
        </BtnPrimary>

        <p style={{ fontSize: '14px', color: t.textSecondary, textAlign: 'center', margin: 0 }}>
          Already have an account?{' '}
          <button onClick={() => goToScreen('login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: t.primary, padding: 0 }}>
            Log in
          </button>
        </p>
      </div>

      <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: '16px', paddingBottom: '32px', marginTop: '32px' }}>
        <p style={{ fontSize: '11px', color: t.textMuted, lineHeight: '1.7', textAlign: 'center', margin: 0 }}>
          By signing up you agree to our{' '}
          <span style={{ color: t.primary, textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => window.open('https://www.niyamalife.com/terms', '_blank')}>
            Terms of Service
          </span>{' '}and{' '}
          <span style={{ color: t.primary, textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => window.open('https://www.niyamalife.com/privacy', '_blank')}>
            Privacy Policy
          </span>.
        </p>
      </div>
    </Screen>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: Log In
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === 'login') return (
    <Screen>
      <BackBtn onPress={() => goToScreen('welcome')} />

      <div style={{ paddingTop: '28px', flex: 1 }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: t.text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '14px', color: t.textSecondary, marginBottom: '32px', lineHeight: '1.6' }}>
          Log in to continue your streak.
        </p>

        <Field label="Email address" type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (usePassword ? handlePasswordLogin() : sendOTP('login'))}
          autoFocus />

        {usePassword && (
          <Field label="Password" type="password" placeholder="Your password"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePasswordLogin()} />
        )}

        <ErrorBox message={message} />

        <BtnPrimary
          onClick={usePassword ? handlePasswordLogin : () => sendOTP('login')}
          loading={loading}
          style={{ marginBottom: '16px' }}
        >
          {loading ? (usePassword ? 'Signing in…' : 'Sending code…') : (usePassword ? 'Log In' : 'Send OTP')}
        </BtnPrimary>

        {/* OTP ↔ Password toggle */}
        <button
          onClick={() => { setUsePassword(v => !v); setMessage('') }}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: '500', color: t.primary,
            padding: '12px 0', textAlign: 'center', fontFamily: 'inherit',
          }}
        >
          {usePassword ? 'Use email OTP instead' : 'Use password instead'}
        </button>

        <p style={{ fontSize: '14px', color: t.textSecondary, textAlign: 'center', marginTop: '16px' }}>
          New to Niyama Life?{' '}
          <button onClick={() => goToScreen('signup')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', color: t.primary, padding: 0 }}>
            Sign up
          </button>
        </p>
      </div>
    </Screen>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // SCREEN: OTP verification
  // ────────────────────────────────────────────────────────────────────────────
  if (screen === 'otp') return (
    <Screen>
      <BackBtn onPress={() => { goToScreen(isNewUser ? 'signup' : 'login'); setDigits(Array(6).fill('')) }} />

      <div style={{ paddingTop: '28px', flex: 1 }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: t.text, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Check your email
        </h2>
        <p style={{ fontSize: '14px', color: t.textSecondary, marginBottom: '40px', lineHeight: '1.6' }}>
          We sent a 6-digit code to{' '}
          <strong style={{ color: t.text, fontWeight: '600' }}>{email}</strong>
        </p>

        {/* 6 digit boxes */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '32px' }}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={r => { digitRefs.current[i] = r }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleDigitChange(e.target.value, i)}
              onKeyDown={e => handleDigitKeyDown(e, i)}
              onPaste={i === 0 ? handleDigitPaste : undefined}
              style={{
                width: '44px', height: '52px', boxSizing: 'border-box',
                border: digit ? `1.5px solid ${t.primary}` : `1.5px solid ${t.border}`,
                borderRadius: '8px', textAlign: 'center',
                fontSize: '22px', fontWeight: '700', color: t.text,
                background: digit ? t.primaryLight : t.card,
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.15s, background 0.15s',
                cursor: 'text',
              }}
            />
          ))}
        </div>

        <ErrorBox message={message} />

        <BtnPrimary
          onClick={() => verifyOTP()}
          loading={loading}
          disabled={digits.join('').length < 6}
          style={{ marginBottom: '20px' }}
        >
          {loading ? 'Verifying…' : 'Verify'}
        </BtnPrimary>

        {/* Resend */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: t.textMuted, marginBottom: '8px' }}>
            Didn't receive it? Check your spam folder.
          </p>
          <button
            onClick={resendOTP}
            disabled={resendCooldown > 0 || resending}
            style={{
              background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'default' : 'pointer',
              fontSize: '14px', fontWeight: '500',
              color: resendCooldown > 0 ? t.textMuted : t.primary,
              fontFamily: 'inherit', padding: 0,
              transition: 'color 0.2s',
            }}
          >
            {resending ? 'Resending…' : resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      </div>
    </Screen>
  )

  return null
}
