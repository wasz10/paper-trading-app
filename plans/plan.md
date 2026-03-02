# Implementation Plan: 3 Commits

## Commit 1: `feat: site password gate middleware + gate page`

### Files to create
1. **`src/app/gate/page.tsx`** — Client component, standalone gate page
   - Centered card with "PaperTrade — Private Beta" title
   - Password input (type="password"), Submit button
   - Error text on wrong password (red text below input)
   - On success: `router.push('/')` then `router.refresh()`
   - No layout wrapping — outside `(auth)` and `(dashboard)` groups

2. **`src/app/api/gate/verify/route.ts`** — POST endpoint
   - Reads `SITE_PASSWORD` from env
   - Compares `body.password === SITE_PASSWORD`
   - On match: sets `site-password-ok` cookie (HttpOnly, SameSite=Lax, Path=/, maxAge=30 days, value=HMAC-SHA256)
   - Returns `{ ok: true }` or `{ error: "Wrong password" }`

### Files to modify
3. **`src/lib/supabase/middleware.ts`** — Add gate check BEFORE auth logic
   - At top of `updateSession()`, before the Supabase client is created:
     ```
     const sitePassword = process.env.SITE_PASSWORD
     if (sitePassword) {
       const pathname = request.nextUrl.pathname
       // Skip gate for: /gate, /api/gate/verify, /api/cron/*
       if (pathname !== '/gate' && !pathname.startsWith('/api/gate') && !pathname.startsWith('/api/cron')) {
         const cookie = request.cookies.get('site-password-ok')?.value
         const expected = hmac(sitePassword, 'paper-trade-gate') // using Web Crypto
         if (cookie !== expected) {
           return NextResponse.redirect(new URL('/gate', request.url))
         }
       }
     }
     ```
   - HMAC computation uses `crypto.subtle` (available in Edge runtime)
   - Import `NextResponse` is already present

4. **`.env.local.example`** — Add `SITE_PASSWORD` with comment

### Implementation notes
- HMAC function: use `crypto.subtle.importKey` + `crypto.subtle.sign` with SHA-256, convert to hex string
- The gate check is ~10 lines of code at the top of `updateSession()`
- Since HMAC is async, and `updateSession` is already async, this is clean
- The gate page uses existing shadcn components (Card, Input, Button)
- No need for a layout.tsx for `/gate` — it uses the root layout

---

## Commit 2: `feat: account deletion with cascade + settings danger zone`

### Files to create
1. **`src/app/api/account/delete/route.ts`** — POST endpoint
   - Auth check with `createClient()` from server.ts
   - Validate `body.confirmName` matches user's `display_name`
   - Use `createAdminClient()` for all deletions (bypass RLS)
   - Sequential delete from 8 tables + `auth.admin.deleteUser()`
   - Return `{ data: { deleted: true } }`

### Files to modify
2. **`src/app/(dashboard)/settings/page.tsx`** — Add Danger Zone section
   - Add new state: `showDeleteDialog`, `deleteConfirmName`, `isDeleting`
   - Add new imports: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `Trash2` icon
   - After the existing "Account" card, add a new card:
     ```
     <Card className="border-destructive/50">
       <CardHeader>
         <CardTitle className="text-destructive">Danger Zone</CardTitle>
         <CardDescription>Permanently delete your account and all data</CardDescription>
       </CardHeader>
       <CardContent>
         <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
           <Trash2 /> Delete My Account
         </Button>
       </CardContent>
     </Card>
     ```
   - Confirmation Dialog:
     - Title: "Delete Account"
     - Description: "This will permanently delete your account and all data. This action cannot be undone."
     - Input: "Type your display name to confirm" — must match `displayName` exactly
     - Delete button disabled until input matches
     - On confirm: POST to `/api/account/delete`, sign out, redirect, toast

### Implementation notes
- The dialog uses existing shadcn Dialog components already imported/available in the project
- The confirmation input pattern (type-to-confirm) is standard for destructive actions
- After successful deletion: `await supabase.auth.signOut()` → `router.push('/login')` → `toast.success('Account deleted')`
- The API route is ~50 lines: auth check, name validation, 8 table deletes, auth user delete

---

## Commit 3: `feat: developer panel with state manipulation tools`

### Files to create
1. **`src/app/(dashboard)/dev/page.tsx`** — Client component, dev tools page
   - Guard: check `DEV_PANEL_ENABLED` — but since this is a client component, we need a different approach:
     - The page fetches `/api/dev/status` on mount to check if dev panel is enabled
     - If disabled, shows "Not found" message styled like a 404
   - Sections (each in a Card):
     - **Token Balance**: Input + "Set" button → `POST /api/dev/tokens`
     - **Cash Balance**: Input (dollars) + "Set" button → `POST /api/dev/cash`
     - **Reset Account**: Button + confirm dialog → `POST /api/dev/reset`
     - **Snapshot**: Button → `POST /api/dev/snapshot` → shows result
     - **Tutorial**: "Complete All" + "Reset" buttons → `POST /api/dev/tutorial`
     - **Streak**: Input + "Set" button → `POST /api/dev/streak`
   - Fetches current user state on mount from `/api/dev/status` to pre-fill inputs
   - Responsive grid: 1 col mobile, 2 col desktop (`grid grid-cols-1 md:grid-cols-2 gap-4`)

2. **`src/app/api/dev/status/route.ts`** — GET endpoint
   - Returns `{ enabled: false }` if `DEV_PANEL_ENABLED !== 'true'`
   - Otherwise: auth check, fetch user profile, return current balance/tokens/streak/etc.

3. **`src/app/api/dev/tokens/route.ts`** — POST `{ balance: number }`
   - Guard + auth + adminClient update `users.token_balance`

4. **`src/app/api/dev/cash/route.ts`** — POST `{ balanceCents: number }`
   - Guard + auth + adminClient update `users.cash_balance`

5. **`src/app/api/dev/reset/route.ts`** — POST (no body)
   - Guard + auth + adminClient:
     - Delete from: tutorial_progress, token_transactions, daily_rewards, portfolio_snapshots, leaderboard_cache, trades, holdings
     - Update users: cash_balance=1000000, token_balance=0, current_streak=0, trades_today=0

6. **`src/app/api/dev/snapshot/route.ts`** — POST (no body)
   - Guard + auth + same logic as cron/snapshot but for single user
   - Returns snapshot data (total_value_cents, cash_cents, holdings_value_cents)

7. **`src/app/api/dev/tutorial/route.ts`** — POST `{ action: 'complete' | 'reset' }`
   - Guard + auth + adminClient:
     - complete: upsert tutorial_progress with all steps = true
     - reset: delete from tutorial_progress

8. **`src/app/api/dev/streak/route.ts`** — POST `{ streak: number }`
   - Guard + auth + adminClient update `users.current_streak`

### Files to modify
9. **`.env.local.example`** — Add `DEV_PANEL_ENABLED` with comment

### Implementation notes
- All 7 API routes share the same guard pattern — create a helper:
  ```typescript
  // At top of each route:
  if (process.env.DEV_PANEL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Dev panel disabled' }, { status: 403 })
  }
  ```
- The dev panel does NOT appear in sidebar or bottom nav — URL-only access
- The page uses existing shadcn components (Card, Input, Button, Dialog)
- Each action shows a toast on success/failure
- Snapshot logic is extracted from the cron route (fetch user holdings, get prices, calculate total)
- Tutorial step IDs: `explore_market`, `first_trade`, `view_portfolio`, `claim_reward`, `complete_tutorial`

---

## File Ownership Matrix

| File | Commit 1 | Commit 2 | Commit 3 |
|------|----------|----------|----------|
| `src/lib/supabase/middleware.ts` | MODIFY | | |
| `src/app/gate/page.tsx` | CREATE | | |
| `src/app/api/gate/verify/route.ts` | CREATE | | |
| `src/app/(dashboard)/settings/page.tsx` | | MODIFY | |
| `src/app/api/account/delete/route.ts` | | CREATE | |
| `src/app/(dashboard)/dev/page.tsx` | | | CREATE |
| `src/app/api/dev/*/route.ts` (7 files) | | | CREATE |
| `.env.local.example` | MODIFY | | MODIFY |

---

## Verification Checklist

### After Commit 1 (Site Password Gate)
- [ ] `npm run build` — 0 errors
- [ ] `npm run lint` — 0 warnings
- [ ] Set `SITE_PASSWORD=test123` in `.env.local`
- [ ] Visit `/` → redirected to `/gate`
- [ ] Enter wrong password → error text shows
- [ ] Enter correct password → redirected to `/`
- [ ] Refresh page → still authenticated (cookie persists)
- [ ] Remove `SITE_PASSWORD` from `.env.local` → gate disabled, site works normally
- [ ] `/api/cron/snapshot` with bearer token → works even when gate is active

### After Commit 2 (Account Deletion)
- [ ] `npm run build` — 0 errors
- [ ] `npm run lint` — 0 warnings
- [ ] Visit `/settings` → Danger Zone card visible at bottom
- [ ] Click "Delete My Account" → dialog opens
- [ ] Type wrong name → delete button stays disabled
- [ ] Type correct display name → delete button enables
- [ ] Click delete → loading state → success toast → redirected to `/login`
- [ ] Try logging in with same credentials → fails (account gone)

### After Commit 3 (Developer Panel)
- [ ] `npm run build` — 0 errors
- [ ] `npm run lint` — 0 warnings
- [ ] Without `DEV_PANEL_ENABLED=true` → `/dev` shows "Not found"
- [ ] With `DEV_PANEL_ENABLED=true`:
  - [ ] `/dev` shows all 6 tool cards
  - [ ] Set token balance → header updates immediately
  - [ ] Set cash balance → reflects on dashboard
  - [ ] Reset account → all holdings/trades cleared, cash back to $10k
  - [ ] Trigger snapshot → shows snapshot result
  - [ ] Complete tutorial → tutorial progress shows all done
  - [ ] Reset tutorial → tutorial banners reappear
  - [ ] Set streak → reflects on rewards page
