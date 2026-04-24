<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Niyama Life web app (React + Vite). PostHog is initialised once in `src/main.jsx` using environment variables. User identity is established in `src/App.jsx` on every session load and auth state change, ensuring all events are correctly linked to known users. `posthog.reset()` is called on sign-out and before account deletion to unlink future events from the deleted identity.

Twelve events are instrumented across six files covering the full user lifecycle: signup/login, daily habit engagement, the upgrade/checkout funnel, referral sharing, and churn signals.

| Event | Description | File |
|---|---|---|
| `signed_up` | New user completes OTP verification | `src/components/Auth.jsx` |
| `logged_in` | Returning user signs in (OTP or password) | `src/components/Auth.jsx` |
| `habit_logged` | User marks a habit complete or incomplete | `src/components/dashboard/HomeTab.jsx` |
| `day_submitted` | User submits their daily habit log | `src/components/dashboard/HomeTab.jsx` |
| `streak_freeze_used` | User activates a streak freeze | `src/components/dashboard/HomeTab.jsx` |
| `upgrade_modal_opened` | User opens the upgrade plan selector | `src/components/dashboard/SettingsTab.jsx` |
| `checkout_started` | User initiates Stripe checkout | `src/components/dashboard/SettingsTab.jsx` |
| `push_notifications_enabled` | User grants push notification permission | `src/components/dashboard/SettingsTab.jsx` |
| `account_paused` | User confirms a 1-month subscription pause | `src/components/dashboard/SettingsTab.jsx` |
| `account_deleted` | User permanently deletes their account | `src/components/dashboard/SettingsTab.jsx` |
| `referral_code_copied` | User copies their referral code | `src/components/dashboard/ReferralTab.jsx` |
| `referral_shared` | User shares their referral code | `src/components/dashboard/ReferralTab.jsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://us.posthog.com/project/388124/dashboard/1505469
- **Signup & Onboarding Funnel:** https://us.posthog.com/project/388124/insights/3nzeDhWu
- **Daily Habit Submissions (Trend):** https://us.posthog.com/project/388124/insights/mqRaUBVn
- **Upgrade Conversion Funnel:** https://us.posthog.com/project/388124/insights/vuPYJqRz
- **Churn Signals (Paused & Deleted):** https://us.posthog.com/project/388124/insights/5LRzEh3I
- **Referral Sharing Activity:** https://us.posthog.com/project/388124/insights/II0v70C7

> **Note:** Run `npm install` in the project root to download `posthog-js` before starting the dev server, as the package was added to `package.json` but needs to be fetched from the npm registry.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
