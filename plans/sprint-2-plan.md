# Sprint 2 Implementation Plan

**Date:** 2026-03-02
**Reference:** `plans/sprint-2-spec.md`

Each feature is one commit (or multiple if large). Features are implemented sequentially in order. Each feature must pass `npm run build` and `npm run lint` before moving to the next.

---

## Feature 1: Google OAuth + Login UI Refresh

**Branch:** `feat/oauth-login-refresh`
**Estimated files:** 7 modified, 0 created

### Steps

1. **Redesign auth layout** (`src/app/(auth)/layout.tsx`)
   - Split into branding panel + form panel
   - Mobile: stacked (branding top, form bottom)
   - Desktop: side-by-side with `md:grid md:grid-cols-2`
   - Branding panel: gradient background, app name, tagline, decorative element

2. **Redesign login page** (`src/app/(auth)/login/page.tsx` + `src/components/auth/login-form.tsx`)
   - Move OAuth buttons above email form
   - Add "or continue with email" divider (thin line with centered text)
   - Improve input styling and spacing
   - Add "Don't have an account? Sign up" link at bottom
   - Loading state on OAuth button click

3. **Redesign signup page** (`src/app/(auth)/signup/page.tsx` + `src/components/auth/signup-form.tsx`)
   - Mirror login page layout with OAuth buttons on top
   - Add "Already a member? Log in" link

4. **Improve OAuth buttons** (`src/components/auth/oauth-buttons.tsx`)
   - Full-width Google button with proper branding
   - Add Apple button placeholder (disabled, "Coming Soon" label)
   - Better error handling: catch OAuth errors, show toast

5. **Update README** — add Google OAuth Supabase setup instructions

### Verification
- `npm run build` — 0 errors
- `npm run lint` — 0 warnings
- Login page renders with new layout
- Google button triggers OAuth flow (if configured in Supabase)
- Apple button shows "Coming Soon" state
- Mobile layout stacks properly

---

## Feature 2: Weekly Challenges

**Branch:** `feat/weekly-challenges`
**Estimated files:** 4 modified, 3 created

### Steps

1. **Create migration** (`supabase/migrations/005_weekly_challenges.sql`)
   - `weekly_challenge_claims` table with RLS policies
   - Unique constraint on (user_id, challenge_id, week_start)

2. **Add progress calculation functions** (`src/lib/game/challenges.ts`)
   - `getWeekStart(timezone)` — returns Monday 00:00 of current week
   - `calculateTradesThisWeek(userId, weekStart)` — count from trades table
   - `calculateStreakChallenge(currentStreak)` — check if >= 5
   - `calculateNewStockChallenge(userId, weekStart)` — compare weekly vs. all-time tickers
   - `getChallengeProgress(userId)` — returns all 3 challenges with progress + completed + claimed

3. **Create status API** (`src/app/api/challenges/status/route.ts`)
   - Auth check
   - Call `getChallengeProgress(userId)`
   - Return: `{ challenges: [{ id, title, description, reward, progress, target, completed, claimed }] }`

4. **Create claim API** (`src/app/api/challenges/claim/route.ts`)
   - Auth check
   - Validate: challenge exists, is completed, not already claimed this week
   - Award tokens with optimistic lock
   - Insert into `weekly_challenge_claims`
   - Insert token transaction
   - Return: `{ ok: true, tokensEarned }`

5. **Wire UI** (`src/components/rewards/weekly-challenge-list.tsx`)
   - Fetch from `/api/challenges/status` on mount
   - Show progress bar for each challenge
   - "Claim" button on completed + unclaimed challenges
   - "Claimed" badge on already claimed

6. **Update rewards page** (`src/app/(dashboard)/rewards/page.tsx`)
   - Pass real challenge data to `WeeklyChallengeList`

### Verification
- `npm run build` — 0 errors
- `/rewards` page shows 3 challenges with live progress
- Completing a challenge shows "Claim" button
- Claiming awards tokens and shows "Claimed" badge
- Claiming again returns error (double-claim prevention)

---

## Feature 3: PWA (Installable + Push)

**Branch:** `feat/pwa-push`
**Estimated files:** 5 modified, 8 created

### Steps

1. **Create app manifest** (`public/manifest.json`)
   - App name: "PaperTrade"
   - Short name: "PaperTrade"
   - Theme color: match dark background
   - Background color: match dark background
   - Display: "standalone"
   - Start URL: "/dashboard"
   - Icons: 192x192 and 512x512

2. **Create app icons** (`public/icons/`)
   - Generate from existing logo or create simple icon
   - 192x192 PNG and 512x512 PNG
   - Maskable versions for Android adaptive icons

3. **Create service worker** (`public/sw.js`)
   - Install event: cache app shell (offline page, key assets)
   - Fetch event: network-first for API, cache-first for static
   - Offline fallback: serve cached offline page when network fails
   - Push event: display notification with title, body, icon, click URL
   - Notification click event: open/focus app window, navigate to URL

4. **Create offline page** (`public/offline.html`)
   - Styled page matching app theme
   - "You're offline — connect to the internet to continue trading"
   - Retry button that reloads the page

5. **Register service worker** — add to root layout (`src/app/layout.tsx`)
   - Client-side script checks `'serviceWorker' in navigator`
   - Registers `/sw.js` on page load

6. **Add manifest link** — add to root layout `<head>`
   - `<link rel="manifest" href="/manifest.json">`
   - `<meta name="theme-color">`
   - `<meta name="apple-mobile-web-app-capable">`
   - `<link rel="apple-touch-icon">`

7. **Create push subscription migration** (`supabase/migrations/006_push_subscriptions.sql`)
   - `push_subscriptions` table with RLS

8. **Create server-side push utility** (`src/lib/notifications/push.ts`)
   - `sendPushNotification(userId, { title, body, url })` function
   - Uses `web-push` package with VAPID keys
   - Fetches all subscriptions for user
   - Sends to each, removes invalid/expired subscriptions
   - Graceful error handling (don't fail calling code if push fails)

9. **Create subscribe API** (`src/app/api/notifications/subscribe/route.ts`)
   - POST: store subscription (endpoint, p256dh, auth keys)
   - DELETE: remove subscription by endpoint

10. **Create push opt-in banner** (`src/components/notifications/push-prompt.tsx`)
    - Dismissible banner below header: "Enable notifications to get alerts for price changes and order fills"
    - "Enable" button triggers permission prompt + subscription
    - "Not now" dismisses (stored in localStorage, don't ask again for 7 days)
    - Only shows after first login (not during onboarding)

11. **Add banner to dashboard layout** (`src/app/(dashboard)/layout.tsx`)

12. **Install `web-push`** dependency

13. **Update env vars** — add VAPID keys to `.env.local.example`

### Verification
- `npm run build` — 0 errors
- App can be installed from browser ("Add to Home Screen")
- Service worker registers on page load
- Push notification banner appears after login
- Enabling notifications creates subscription in DB
- Offline page displays when network is disconnected

---

## Feature 4: Limit / Stop / Trailing Stop Orders

**Branch:** `feat/limit-orders`
**Estimated files:** 12 modified, 12 created

### Steps

#### Database & Types (Step 1)

1. **Create migration** (`supabase/migrations/007_pending_orders.sql`)
   - `pending_orders` table with indexes and RLS
   - `ALTER TABLE users ADD COLUMN reserved_cash`
   - `ALTER TABLE holdings ADD COLUMN reserved_shares`

2. **Update types** (`src/types/index.ts`)
   - Add `PendingOrder` interface
   - Add `OrderStatus = 'pending' | 'filled' | 'cancelled' | 'expired'`
   - Add `PendingOrderType = 'limit_buy' | 'limit_sell' | 'stop_loss' | 'trailing_stop'`
   - Add `TimeInForce = 'gtc' | 'day'`

#### Engine Logic (Step 2)

3. **Create reservation helpers** (`src/lib/trading/reservations.ts`)
   - `reserveCash(userId, amountCents)` — deduct from cash_balance, add to reserved_cash
   - `releaseCash(userId, amountCents)` — reverse of reserve
   - `reserveShares(userId, ticker, shares)` — add to reserved_shares on holding
   - `releaseShares(userId, ticker, shares)` — reverse of reserve
   - All use optimistic locking

4. **Create order engine** (`src/lib/trading/order-engine.ts`)
   - `evaluateOrder(order, currentPriceCents)` → `{ shouldFill: boolean, fillPriceCents: number }`
     - Limit buy: fill if currentPrice <= targetPrice, fill at currentPrice
     - Limit sell: fill if currentPrice >= targetPrice, fill at currentPrice
     - Stop loss: fill if currentPrice <= stopPrice, fill at currentPrice
     - Trailing stop: update high-water mark, calculate dynamic stop, fill if currentPrice <= dynamicStop
   - `fillOrder(order, fillPriceCents)` — execute the trade, update order status, release reservations
   - `expireDayOrders()` — mark expired orders, release reservations

5. **Modify existing trade routes** to respect reservations:
   - `src/app/api/trade/buy/route.ts` — available cash = `cash_balance - reserved_cash`
   - `src/app/api/trade/sell/route.ts` — available shares = `shares - reserved_shares`

#### API Routes (Step 3)

6. **Create order API** (`src/app/api/orders/create/route.ts`)
   - Auth check
   - Validate: order type, price, shares, time-in-force
   - Check pending order limit (5 free / 15 subscriber)
   - Reserve cash (buys) or shares (sells)
   - Insert into `pending_orders`
   - Return created order

7. **Create order list API** (`src/app/api/orders/route.ts`)
   - Auth check
   - Query orders with status filter
   - Return paginated list sorted by created_at DESC

8. **Create cancel API** (`src/app/api/orders/cancel/route.ts`)
   - Auth check
   - Validate: order exists, belongs to user, is pending
   - Release reservations
   - Update status to 'cancelled'

9. **Create check API** (`src/app/api/orders/check/route.ts`)
   - Auth check
   - Fetch all pending orders for current user
   - Batch-fetch quotes for unique tickers
   - Evaluate each order
   - Fill qualifying orders
   - Return list of filled orders (for UI toast notifications)

10. **Create cron endpoint** (`src/app/api/cron/orders/route.ts`)
    - Bearer token auth (CRON_SECRET)
    - Fetch ALL pending orders across all users
    - Group by ticker, batch-fetch quotes
    - Evaluate and fill qualifying orders
    - Expire day orders after 4 PM ET
    - Update trailing stop high-water marks
    - Send push notifications for fills
    - Return summary: `{ checked, filled, expired }`

#### UI Components (Step 4)

11. **Create order form** (`src/components/trade/order-form.tsx`)
    - Tabs: Limit Buy, Limit Sell, Stop Loss, Trailing Stop
    - Each tab shows relevant fields:
      - Limit: target price + shares + GTC/Day
      - Stop: stop price + shares + GTC/Day
      - Trailing: trail $ or % + shares + GTC/Day
    - Preview card with estimated cost/proceeds
    - Submit button with loading state

12. **Update buy/sell modals** (`src/components/trade/buy-modal.tsx`, `sell-modal.tsx`)
    - Add "Order Type" selector above existing form: Market (default) / Limit
    - When Limit selected, show order form instead of market form
    - Keep market order flow unchanged

13. **Create order card** (`src/components/trade/order-card.tsx`)
    - Shows: ticker, order type badge, target price, shares, status, created date
    - Cancel button (pending orders only)
    - Fill details (filled orders): fill price, fill date

14. **Create orders page** (`src/app/(dashboard)/orders/page.tsx`)
    - Tabs: Pending / Filled / All
    - List of order cards
    - Empty state: "No pending orders. Place your first limit order!"

15. **Add pending orders section to dashboard** (`src/app/(dashboard)/dashboard/page.tsx`)
    - Below holdings: "Pending Orders (X)" collapsible section
    - Shows top 3 pending orders with "View all" link

16. **Update navigation** (`src/components/layout/sidebar.tsx`, `bottom-nav.tsx`)
    - Add "Orders" item with list icon
    - Bottom nav: replace one item or add "More" menu

17. **Update vercel.json** — add cron schedule for `/api/cron/orders`

### Verification
- `npm run build` — 0 errors
- Can place limit buy order: cash is reserved, order appears in pending
- Can place stop loss order: shares are reserved
- Can place trailing stop: high-water mark tracks correctly
- Orders fill when price conditions met (test via dev panel price manipulation or page visit)
- Day orders expire after market close
- Cancelling order releases reservations
- Market orders still work correctly (available cash/shares respects reservations)
- Cron endpoint fills qualifying orders
- Push notification sent on fill

---

## Feature 5: Price Alerts

**Branch:** `feat/price-alerts`
**Estimated files:** 8 modified, 10 created

### Steps

1. **Create migration** (`supabase/migrations/008_alerts_notifications.sql`)
   - `price_alerts` table with indexes and RLS
   - `notifications` table with indexes and RLS

2. **Update types** (`src/types/index.ts`)
   - Add `PriceAlert` interface
   - Add `Notification` interface
   - Add `AlertCondition = 'above' | 'below'`

3. **Create alert engine** (`src/lib/alerts/engine.ts`)
   - `evaluateAlert(alert, currentPriceCents)` → boolean
   - `triggerAlert(alert, currentPriceCents)` — update status, create notification, send push

4. **Create alert APIs**
   - `POST /api/alerts/create` — validate, check limit (5 free/15 sub), insert
   - `GET /api/alerts` — list alerts with status filter
   - `DELETE /api/alerts/[id]` — cancel active alert

5. **Create notification APIs**
   - `GET /api/notifications` — list notifications, paginated, newest first
   - `POST /api/notifications/read` — mark notification(s) as read

6. **Integrate alerts into cron** (`src/app/api/cron/orders/route.ts`)
   - After checking pending orders, also check active price alerts
   - Reuse the same batch-fetched quotes (same tickers possible)

7. **Integrate alerts into page visit** (`src/app/api/orders/check/route.ts`)
   - After checking orders, also check price alerts for current user

8. **Create alert button** (`src/components/market/alert-button.tsx`)
   - "Set Alert" button on stock detail page
   - Modal: price input + above/below toggle
   - Shows current active alerts for this ticker below modal

9. **Create notification bell** (`src/components/notifications/notification-bell.tsx`)
   - Bell icon in header with unread count badge
   - Click: dropdown showing recent 5 notifications
   - Each notification: icon (by type), title, body, time ago
   - Click notification → navigate to URL, mark as read
   - "Mark all read" and "View all" links

10. **Update stock detail page** — add alert button
11. **Update header** — add notification bell between tokens and avatar

### Verification
- Can create price alert (above/below) on any stock
- Alert limit enforced (5 free / 15 subscriber)
- Alert triggers correctly when price crosses target
- Triggered alert creates in-app notification
- Push notification sent
- Notification bell shows unread count
- Clicking notification navigates and marks as read

---

## Feature 6: Achievements & Badges

**Branch:** `feat/achievements`
**Estimated files:** 10 modified, 8 created

### Steps

1. **Create migration** (`supabase/migrations/009_achievements.sql`)
   - `user_achievements` table with RLS

2. **Create achievement definitions** (`src/lib/game/achievements.ts`)
   - Array of 15 achievements with: id, name, description, icon, tokens, category, check function
   - Categories: Trading, Profit, Streaks, Portfolio, Milestones
   - `checkAchievements(userId, context)` — checks all unearned achievements, awards qualifying ones
   - Context object: `{ tradesCount, totalPL, currentStreak, portfolioValue, holdingsCount, tutorialComplete, hasLimitOrder }`

3. **Create achievement API** (`src/app/api/achievements/route.ts`)
   - Auth check
   - Fetch user's unlocked achievements from DB
   - Calculate progress for locked achievements
   - Return full list with status + progress

4. **Create achievement check API** (`src/app/api/achievements/check/route.ts`)
   - Auth check
   - Build context (fetch trades count, portfolio value, etc.)
   - Run `checkAchievements()` — returns newly unlocked list
   - For each new unlock: insert to DB, award tokens, create notification, send push
   - Return: `{ newAchievements: [...] }`

5. **Integrate achievement checks** — add `POST /api/achievements/check` call after:
   - Trade execution (buy/sell routes)
   - Daily reward claim
   - Order placement
   - This is a fire-and-forget call (don't block the main response)

6. **Create achievement grid** (`src/components/achievements/achievement-grid.tsx`)
   - Responsive grid: 2 cols mobile, 3 cols desktop
   - Category headers (Trading, Profit, Streaks, Portfolio, Milestones)

7. **Create achievement card** (`src/components/achievements/achievement-card.tsx`)
   - Unlocked: colored icon, name, description, token reward, unlock date
   - Locked: greyed out, progress bar (e.g., "3/10 trades"), token reward preview

8. **Create unlock celebration** (`src/components/achievements/unlock-celebration.tsx`)
   - Confetti burst via `canvas-confetti`
   - Toast: "Achievement Unlocked: [Name]! +[tokens] tokens"
   - Called when `/api/achievements/check` returns new achievements

9. **Create achievements page** (`src/app/(dashboard)/achievements/page.tsx`)
   - Title + count: "Achievements (X/15)"
   - Achievement grid
   - Total tokens earned from achievements

10. **Update leaderboard** — show top 3 badges next to user names
11. **Update navigation** — add Achievements to sidebar and "More" menu

### Verification
- `/achievements` page shows all 15 achievements with correct locked/unlocked state
- Executing first trade unlocks "First Steps" with confetti + toast
- Selling at profit unlocks "In the Green"
- Token rewards are credited correctly
- Achievement badges appear on leaderboard
- No duplicate unlocks (idempotent)

---

## Feature 7: UI Polish & Animations

**Branch:** `feat/ui-polish`
**Estimated files:** 15+ modified, 10+ created

### Steps

1. **Install dependencies** — `canvas-confetti`, verify `framer-motion` installed

2. **Create AnimatedNumber component** (`src/components/ui/animated-number.tsx`)
   - Props: `value`, `format` ('currency' | 'percent' | 'number'), `duration` (default 500ms)
   - Uses `requestAnimationFrame` to interpolate
   - Green text flash on increase, red on decrease
   - Formats using `Intl.NumberFormat`

3. **Create confetti utility** (`src/components/ui/confetti.tsx`)
   - `triggerConfetti()` function using `canvas-confetti`
   - Configurable: burst origin, particle count, spread

4. **Add page transition wrapper** (`src/app/(dashboard)/layout.tsx`)
   - Framer Motion `motion.div` with fade + slide-up animation
   - 150ms enter, instant exit
   - Key by pathname for proper transitions

5. **Create loading.tsx files** for each route
   - `src/app/(dashboard)/dashboard/loading.tsx` — 3 skeleton cards + chart skeleton
   - `src/app/(dashboard)/explore/loading.tsx` — search bar + grid skeletons
   - `src/app/(dashboard)/stock/[ticker]/loading.tsx` — header + chart + stats skeletons
   - `src/app/(dashboard)/leaderboard/loading.tsx` — rank card + 10 row skeletons
   - `src/app/(dashboard)/rewards/loading.tsx` — streak + challenges skeletons
   - `src/app/(dashboard)/achievements/loading.tsx` — grid skeletons
   - `src/app/(dashboard)/orders/loading.tsx` — order card skeletons

6. **Apply AnimatedNumber** to key displays:
   - Portfolio total value, cash, holdings value, total P&L
   - Token balance in header
   - Leaderboard return percentages
   - Individual holding P&L values

7. **Add micro-interactions**:
   - Card hover: `hover:scale-[1.02] transition-transform` on interactive cards
   - Button press: `active:scale-[0.98]` on primary buttons
   - Trade confirmation: green/red flash effect on success card
   - Streak milestone: special animation at 7 and 30 days

8. **Polish celebrations**:
   - Achievement unlock: confetti + toast (from Feature 6)
   - Daily reward claim: coin animation (tokens floating up)
   - First trade: subtle celebration

### Verification
- Number animations smooth at 60fps
- Page transitions feel natural, not janky
- All pages have proper loading skeletons
- Confetti fires on achievement unlock
- No layout shifts during animations
- Mobile performance is acceptable (test on throttled connection)

---

## Feature 8: Test Suite

**Branch:** `feat/test-suite`
**Estimated files:** 0 modified, 25+ created

### Steps

1. **Set up test infrastructure**
   - `src/test/setup.ts` — global test setup, mocks
   - `src/test/helpers.ts` — mock factories (user, trade, quote, holding)
   - `src/test/mocks/supabase.ts` — mock Supabase client
   - Update `vitest.config.ts` if needed

2. **Trading engine tests** (`src/lib/trading/`)
   - `engine.test.ts` — executeBuy, executeSell (10+ cases)
   - `order-engine.test.ts` — evaluateOrder for each type (8+ cases)
   - `reservations.test.ts` — reserve/release cash and shares (6+ cases)
   - `validation.test.ts` — all validation rules (8+ cases)
   - `calculations.test.ts` — weighted avg, P&L, portfolio value (6+ cases)

3. **Game logic tests** (`src/lib/game/`)
   - `streaks.test.ts` — first login, consecutive, gap, same day (6+ cases)
   - `rewards.test.ts` — each tier, cycle at day 8 (4+ cases)
   - `achievements.test.ts` — each achievement check function (15 cases)
   - `challenges.test.ts` — progress calculation for each challenge (6+ cases)

4. **Alert engine tests** (`src/lib/alerts/`)
   - `engine.test.ts` — above/below evaluation (4+ cases)

5. **Leaderboard tests** (`src/lib/leaderboard/`)
   - `calculations.test.ts` — return %, display name, period dates (6+ cases)

6. **Rate limiter tests** (`src/lib/`)
   - `rate-limit.test.ts` — allow, block, eviction, cap (existing test file, expand)

7. **Component tests**
   - `login-form.test.tsx` — render, submit, validation (3+ cases)
   - `signup-form.test.tsx` — render, password match, submit (3+ cases)
   - `buy-modal.test.tsx` — input sync, validation, submit (4+ cases)
   - `sell-modal.test.tsx` — max shares, submit (3+ cases)
   - `order-form.test.tsx` — each order type form (4+ cases)
   - `alert-button.test.tsx` — create alert flow (2+ cases)
   - `streak-display.test.tsx` — day highlighting (3+ cases)
   - `achievement-card.test.tsx` — locked vs unlocked (2+ cases)
   - `animated-number.test.tsx` — format output (3+ cases)
   - `notification-bell.test.tsx` — unread badge (2+ cases)

8. **Run full suite and fix failures**

### Verification
- `npm run test` — all tests pass
- Coverage report shows 80%+ on critical paths
- No flaky tests
- Tests run in <30 seconds

---

## Commit Strategy

Each feature gets its own branch and PR:

| Feature | Branch | Commits |
|---------|--------|---------|
| F1: OAuth | `feat/oauth-login-refresh` | 1 commit |
| F2: Challenges | `feat/weekly-challenges` | 1 commit |
| F3: PWA | `feat/pwa-push` | 1-2 commits |
| F4: Limit Orders | `feat/limit-orders` | 2-3 commits (DB+engine, API, UI) |
| F5: Alerts | `feat/price-alerts` | 1-2 commits |
| F6: Achievements | `feat/achievements` | 1-2 commits |
| F7: UI Polish | `feat/ui-polish` | 1-2 commits |
| F8: Tests | `feat/test-suite` | 1-2 commits |

Each branch merges to master after verification. STRIDE security review after F4 and F8.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Yahoo Finance rate limits from order/alert cron | Medium | Batch by ticker, use cache, only check during market hours |
| Push notification browser support | Low | Progressive enhancement — feature works without push, push is bonus |
| Trailing stop complexity | Medium | Thorough unit tests, dev panel for testing |
| Mobile bottom nav overcrowding | Low | "More" menu pattern keeps it clean |
| Test suite maintenance burden | Low | Focus on engine/logic tests (stable), fewer component tests (more brittle) |
