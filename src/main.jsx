import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import posthog from 'posthog-js'
import mixpanel from 'mixpanel-browser'

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: '2026-01-30',
})

mixpanel.init(import.meta.env.VITE_MIXPANEL_TOKEN, {
  track_pageview: true,
  persistence: 'localStorage',
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)