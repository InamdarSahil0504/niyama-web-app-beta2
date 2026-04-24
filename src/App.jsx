import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import Dashboard from './components/dashboard/Dashboard'
import ResetPassword from './components/ResetPassword'
import posthog from 'posthog-js'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) posthog.identify(session.user.id)
      setSession(session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) posthog.identify(session.user.id)
      else posthog.reset()
      setSession(session)
    })
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--theme-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid var(--theme-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '14px', color: 'var(--theme-text-secondary)' }}>Loading...</p>
      </div>
    </div>
  )

  const isResetPassword = window.location.pathname === '/reset-password'

  return (
    <div>
      {isResetPassword
        ? <ResetPassword />
        : !session
          ? <Auth />
          : <Dashboard session={session} />
      }
    </div>
  )
}

export default App
