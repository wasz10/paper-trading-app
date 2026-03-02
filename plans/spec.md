# Feature Spec: Site Password Gate, Account Deletion, Developer Panel

## 1. Site Password Gate

### Overview
A middleware-based password wall that blocks ALL access to the site until a shared password is entered. This is a pre-auth gate — it fires before Supabase auth, before the landing page, before everything.

### Behavior
- **When `SITE_PASSWORD` env var is set** (any non-empty string): every request is intercepted. If the user's cookie (`site-password-ok`) does not contain the correct HMAC, they are redirected to `/gate`.
- **When `SITE_PASSWORD` env var is NOT set or empty**: the gate is completely disabled. No redirect, no cookie check — the app works normally. This makes it a zero-config off switch for production.
- **Gate page (`/gate`)**: A standalone page (outside `(auth)` and `(dashboard)` groups) with a single password input, a "Submit" button, and error text on wrong password.
- **Cookie**: `site-password-ok` — HttpOnly, SameSite=Lax, Path=/, 30-day expiry, value is `HMAC-SHA256(SITE_PASSWORD, "paper-trade-gate")` so we never store the raw password.
- **API route**: `POST /api/gate/verify` — receives `{ password: string }`, compares against `SITE_PASSWORD`, sets cookie on success, returns `{ ok: true }` or `{ error: "Wrong password" }`.

### Excluded paths
The gate must NOT block:
- `/gate` itself (infinite redirect loop)
- `/api/gate/verify` (the verification endpoint)
- `/_next/*`, `/favicon.ico`, static assets (already excluded by middleware matcher)
- `/api/cron/*` (cron jobs use bearer token auth, not cookies)

### Environment variable
- Name: `SITE_PASSWORD`
- Added to `.env.local.example` with a comment
- Set in Vercel dashboard for preview/staging deployments
- When removed or empty, gate is fully disabled

### UI
- Centered card, title "PaperTrade — Private Beta", single password input with type="password", Submit button
- Error state: red text below input on wrong password
- No navigation, no sidebar, no header — completely standalone
- Uses existing shadcn Card, Input, Button components
- Dark theme compatible (uses CSS variables)

---

## 2. Account Deletion (Settings Danger Zone)

### Overview
A "Danger Zone" section at the bottom of the Settings page with a single destructive button that permanently deletes the user's account and all associated data.

### User flow
1. User scrolls to bottom of `/settings` → sees red-bordered "Danger Zone" card
2. Clicks "Delete My Account" button (red/destructive variant)
3. Confirmation dialog opens: "Are you sure? This will permanently delete your account and all data. This action cannot be undone."
4. User must type their display name into a text input to confirm (prevents accidental clicks)
5. "Delete Account" button is disabled until typed text matches display name exactly
6. On confirm: POST to `/api/account/delete`, shows loading spinner
7. On success: sign out, redirect to `/login`, toast "Account deleted"
8. On failure: toast error, dialog stays open for retry

### API Route: `POST /api/account/delete`
- Auth check: `supabase.auth.getUser()` — must be authenticated
- Requires body: `{ confirmName: string }` — must match user's display_name
- Uses `createAdminClient()` to bypass RLS for cascade deletion
- Deletion order (all in a single admin client session, sequential):
  1. `tutorial_progress` WHERE user_id = ?
  2. `token_transactions` WHERE user_id = ?
  3. `daily_rewards` WHERE user_id = ?
  4. `portfolio_snapshots` WHERE user_id = ?
  5. `leaderboard_cache` WHERE user_id = ?
  6. `trades` WHERE user_id = ?
  7. `holdings` WHERE user_id = ?
  8. `users` WHERE id = ?
  9. `auth.admin.deleteUser(userId)` — removes from Supabase Auth
- Returns `{ data: { deleted: true } }` on success
- Returns `{ error: string }` on failure (rolls back nothing — partial deletion is acceptable since the auth user is deleted last)

### Why manual cascade instead of relying on ON DELETE CASCADE?
- All FK constraints already have `ON DELETE CASCADE` referencing `users.id` (and `tutorial_progress` references `auth.users.id`)
- However, deleting from `auth.users` via the admin API triggers the FK cascade through `users.id -> auth.users.id`
- We delete from `public.*` tables first explicitly to ensure clean removal, then delete the auth user last
- This is the safest approach: if the admin `deleteUser()` call fails, the public data is already gone but the user can still sign in (they'll land on onboarding as a fresh user)

### UI Components
- Add a new `<Card>` section at the bottom of `settings/page.tsx` with red border styling
- Use existing shadcn `Dialog` for the confirmation modal
- Display name confirmation input must match exactly (case-sensitive)
- All within the existing settings page — no new page needed

---

## 3. Developer Panel

### Overview
A hidden developer tools page at `/dev` (inside the `(dashboard)` layout group so it gets the sidebar/header) that provides state manipulation tools for testing. Protected by a `DEV_PANEL_ENABLED` env var.

### Access control
- **`DEV_PANEL_ENABLED` env var**: Must be set to `"true"` for the page to work. If not set, the page returns a 404-like "Not found" message.
- **Auth required**: Uses the dashboard layout, so Supabase auth is enforced automatically
- **No sidebar link**: The page is accessible only by typing `/dev` in the URL bar. No nav item in sidebar or bottom nav.

### Features (all operate on the currently-authenticated user)

#### 1. Set Token Balance
- Input field with current balance pre-filled
- "Set" button → `POST /api/dev/tokens` with `{ balance: number }`
- API uses `createAdminClient()` to bypass RLS
- Updates `users.token_balance` directly
- Updates Zustand profile store on success

#### 2. Set Cash Balance
- Input field with current balance pre-filled (display in dollars, store in cents)
- "Set" button → `POST /api/dev/cash` with `{ balanceCents: number }`
- API uses `createAdminClient()` to bypass RLS
- Updates `users.cash_balance` directly

#### 3. Reset Account
- Button: "Reset to Fresh Account"
- Confirmation dialog (simple, no name-typing required)
- `POST /api/dev/reset` — resets cash to $10,000 (1000000 cents), tokens to 0, streak to 0, trades_today to 0, deletes all holdings/trades/rewards/snapshots/tutorial_progress/token_transactions/leaderboard_cache for this user
- Does NOT delete the auth user or the `users` row — just resets everything to day-one state

#### 4. Trigger Portfolio Snapshot
- Button: "Take Snapshot Now"
- `POST /api/dev/snapshot` — runs the same logic as the cron snapshot but only for the current user
- Shows result: total value, cash, holdings value

#### 5. Complete/Reset Tutorial
- Two buttons: "Complete All Steps" and "Reset Tutorial"
- Complete: Sets all 5 step IDs to `true` in `tutorial_progress.steps_completed`, sets `completed_at`
- Reset: Deletes the `tutorial_progress` row for this user

#### 6. Set Streak
- Input field with current streak pre-filled
- "Set" button → `POST /api/dev/streak` with `{ streak: number }`
- Updates `users.current_streak` directly

### API Routes
All dev API routes follow the same pattern:
1. Check `process.env.DEV_PANEL_ENABLED !== 'true'` → return 403
2. Auth check via `createClient()` from server.ts → get user ID
3. Use `createAdminClient()` for the actual DB mutation (bypass RLS)
4. Return `{ data: { ... } }` on success

### UI Layout
- Title: "Developer Tools" with a warning badge "DEV ONLY"
- Grid of cards, one per tool
- Each card: title, description, input(s) if needed, action button
- Uses existing shadcn Card, Input, Button components
- Toast feedback on success/failure (sonner)
- Responsive: 1 column on mobile, 2 columns on desktop

### Environment variable
- Name: `DEV_PANEL_ENABLED`
- Added to `.env.local.example` with a comment
- Set to `"true"` in local dev and Vercel preview, NOT in production

---

## Database Tables Reference (for deletion ordering)

| Table | FK Reference | ON DELETE CASCADE |
|-------|-------------|-------------------|
| `users` | `auth.users(id)` | Yes |
| `holdings` | `users(id)` | Yes |
| `trades` | `users(id)` | Yes |
| `daily_rewards` | `users(id)` | Yes |
| `leaderboard_cache` | `users(id)` | Yes |
| `token_transactions` | `users(id)` | Yes |
| `portfolio_snapshots` | `users(id)` | Yes |
| `tutorial_progress` | `auth.users(id)` | Yes |

---

## New Environment Variables Summary

| Variable | Purpose | Default | Production |
|----------|---------|---------|------------|
| `SITE_PASSWORD` | Password gate shared password | (unset = disabled) | Unset |
| `DEV_PANEL_ENABLED` | Enable `/dev` panel | (unset = disabled) | Never set |
