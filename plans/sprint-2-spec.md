# Sprint 2 Feature Spec — Paper Trading App

**Date:** 2026-03-02
**Scope:** 8 features implemented sequentially

---

## Implementation Order

| # | Feature | Complexity | Depends On |
|---|---------|-----------|------------|
| 1 | Google OAuth + Login UI Refresh | Small | — |
| 2 | Weekly Challenges | Small | — |
| 3 | PWA (Installable + Push) | Medium | — |
| 4 | Limit / Stop / Trailing Stop Orders | Large | PWA (for fill push) |
| 5 | Price Alerts | Medium | PWA (for alert push) |
| 6 | Achievements & Badges | Medium | PWA (for unlock push) |
| 7 | UI Polish & Animations | Medium | All features complete |
| 8 | Test Suite | Medium | All features complete |

**Rationale:** Quick wins first (OAuth, challenges), then PWA to establish push notification infrastructure, then complex features that leverage push (orders, alerts, achievements), then polish and tests last since they touch everything.

---

## Feature 1: Google OAuth + Login UI Refresh

### Overview
Improve the login/signup pages with a refreshed design and ensure Google OAuth works end-to-end. Build the UI layout to accommodate Apple Sign-In later (button slot, divider) without implementing Apple yet.

### Current State
- `signInWithGoogle()` exists in `src/lib/supabase/auth.ts`
- `OAuthButtons` component renders a Google button on login/signup
- Callback handler at `/callback/route.ts` exchanges auth code for session
- Login/signup forms use basic shadcn cards

### Changes

#### Login/Signup Page Redesign
- Split layout: branding panel (left/top) + form panel (right/bottom)
  - Branding panel: app logo, tagline ("Learn to trade. Zero risk."), stock illustration or gradient
  - Mobile: branding stacks above form; desktop: side-by-side
- OAuth buttons above the email form (social login is the primary CTA)
- "or continue with email" divider between OAuth and email form
- Google button: full-width with Google icon and "Continue with Google" text
- Apple button slot: render a disabled/placeholder "Coming soon" Apple button (or hide entirely and leave layout space)
- Footer link: "Don't have an account? Sign up" / "Already have a member? Log in"

#### Google OAuth Flow Improvements
- Handle OAuth errors gracefully (show toast with message)
- Handle edge case: user signs up with email, then tries Google with same email (Supabase handles linking, but show appropriate message)
- After successful OAuth: check if `users` row exists → if not, redirect to onboarding
- Loading state while OAuth redirect is processing

#### Supabase Dashboard Configuration Required
- Enable Google provider in Supabase Auth → Providers
- Add Google OAuth Client ID and Secret (from Google Cloud Console)
- Set redirect URL: `{SUPABASE_URL}/auth/v1/callback`
- Documentation: add setup steps to README

### Files to Modify
- `src/components/auth/login-form.tsx` — redesign
- `src/components/auth/signup-form.tsx` — redesign
- `src/components/auth/oauth-buttons.tsx` — improve styling, add Apple placeholder
- `src/app/(auth)/login/page.tsx` — new layout
- `src/app/(auth)/signup/page.tsx` — new layout
- `src/app/(auth)/layout.tsx` — update for split layout
- `README.md` — add Google OAuth setup section

### No New Tables

---

## Feature 2: Weekly Challenges

### Overview
Wire the existing challenge definitions to a working API and UI. Challenges reset every Monday at midnight (user's timezone). Users can track progress and claim rewards when a challenge is complete.

### Current State
- 3 challenges defined in `src/lib/game/challenges.ts`:
  - `trades_3`: "Active Trader" — Make 3+ trades this week (30 tokens)
  - `login_5`: "Dedicated Investor" — Log in 5+ days in a row (40 tokens)
  - `new_stock`: "Diversifier" — Buy a stock you've never owned (25 tokens)
- `WeeklyChallengeList` component exists on rewards page
- `token_reason` enum already includes `'weekly_challenge'`

### Challenge Mechanics

#### Progress Tracking
- `trades_3`: Count trades in `trades` table where `created_at >= Monday 00:00 (user TZ)`
- `login_5`: Check if `current_streak >= 5` on the users table
- `new_stock`: Compare this week's buy tickers against all-time buy tickers before this week. If any ticker in this week's buys is not in the all-time set, challenge is met.

#### Weekly Reset
- Challenges reset every Monday at 00:00 in the user's timezone
- Progress is recalculated on each status fetch (no stored progress — derived from existing data)
- Claimed rewards stored in `weekly_challenge_claims` table to prevent double-claims

#### Claim Flow
1. User sees a challenge marked "Complete" with a "Claim" button
2. POST `/api/challenges/claim` with `{ challengeId: string }`
3. Server validates: challenge is complete AND not already claimed this week
4. Awards tokens via optimistic lock on `token_balance`
5. Records claim in `weekly_challenge_claims` table
6. Records token transaction with reason `weekly_challenge`

### New Database Table

```sql
CREATE TABLE weekly_challenge_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  week_start DATE NOT NULL, -- Monday of the claim week
  tokens_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, week_start)
);
```

### API Routes
- `GET /api/challenges/status` — Returns all 3 challenges with progress %, completed boolean, claimed boolean
- `POST /api/challenges/claim` — Claim reward for a completed challenge

### Files to Create
- `src/app/api/challenges/status/route.ts`
- `src/app/api/challenges/claim/route.ts`
- `supabase/migrations/005_weekly_challenges.sql`

### Files to Modify
- `src/lib/game/challenges.ts` — add progress calculation functions
- `src/components/rewards/weekly-challenge-list.tsx` — wire to real API
- `src/app/(dashboard)/rewards/page.tsx` — fetch challenge status

---

## Feature 3: PWA (Installable + Push Notifications)

### Overview
Make the app installable on mobile devices (home screen icon, splash screen) and set up push notification infrastructure via a service worker. The push system will be used by Features 4, 5, and 6.

### Installable App
- `public/manifest.json` with app name, icons, theme color, display mode
- App icons: 192x192 and 512x512 PNG (generate from existing logo)
- Theme color: match dark theme background
- Display mode: `standalone` (hides browser chrome)
- Splash screen: auto-generated from manifest fields
- `<link rel="manifest">` in root layout `<head>`

### Service Worker
- Register service worker in root layout (client-side)
- **Caching strategy:** Network-first for API routes, cache-first for static assets
- **Offline shell:** When offline, show a styled "You're offline" page instead of browser error
- **Push subscription:** Handle `push` events, display notifications via `self.registration.showNotification()`

### Push Notification Infrastructure
- **Subscription flow:**
  1. After login, prompt user to enable notifications (dismissible banner, not on first visit)
  2. Call `registration.pushManager.subscribe()` with VAPID public key
  3. POST subscription to `/api/notifications/subscribe`
  4. Store subscription in `push_subscriptions` table
- **Sending notifications (server-side):**
  - Use `web-push` npm package
  - Utility function `sendPushNotification(userId, title, body, url)` in `src/lib/notifications/push.ts`
  - Fetches user's subscriptions, sends to all (user may have multiple devices)
  - Handles expired/invalid subscriptions (delete from DB)
- **VAPID keys:** Generate once, store in env vars (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`)

### New Database Table

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Notification Types (used by later features)
- `order_filled` — "Your limit buy for AAPL at $150 was filled!"
- `price_alert` — "AAPL hit your target price of $200!"
- `achievement_unlocked` — "Achievement unlocked: First Profit!"
- `streak_reminder` — "Don't lose your 7-day streak! Claim your reward today."

### New Environment Variables
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — for client-side subscription
- `VAPID_PRIVATE_KEY` — for server-side push sending
- `VAPID_SUBJECT` — mailto: or URL identifier

### API Routes
- `POST /api/notifications/subscribe` — Store push subscription
- `DELETE /api/notifications/subscribe` — Remove subscription
- `GET /api/notifications/status` — Check if user has active subscription

### Files to Create
- `public/manifest.json`
- `public/sw.js` — service worker
- `public/icons/` — app icons (192, 512)
- `src/lib/notifications/push.ts` — server-side push utility
- `src/components/notifications/push-prompt.tsx` — opt-in banner
- `src/app/api/notifications/subscribe/route.ts`
- `src/app/api/notifications/status/route.ts`
- `supabase/migrations/006_push_subscriptions.sql`

### Files to Modify
- `src/app/layout.tsx` — add manifest link, register service worker
- `src/app/(dashboard)/layout.tsx` — render push prompt banner
- `.env.local.example` — add VAPID variables
- `README.md` — add PWA setup section

---

## Feature 4: Limit / Stop / Trailing Stop Orders

### Overview
Add pending order types that execute automatically when price conditions are met. Orders are checked on every page visit (when the user is active) and via a cron job every 15 minutes during market hours (when the user is away).

### Order Types

#### Limit Buy
- User sets a **target price** (max they'll pay)
- Executes when current market price **<= target price**
- Cash is **reserved** (locked) when the order is placed — prevents spending the cash elsewhere
- If order is cancelled, reserved cash returns to available balance

#### Limit Sell
- User sets a **target price** (min they'll accept)
- Executes when current market price **>= target price**
- Shares are **reserved** (locked) when the order is placed — prevents selling them elsewhere
- If order is cancelled, reserved shares return to available balance

#### Stop Loss
- User sets a **stop price** (exit point)
- Executes a market sell when current price **<= stop price**
- Shares are reserved when placed
- Protects against downside — "sell if it drops below $X"

#### Trailing Stop
- User sets a **trail amount** (dollar amount or percentage below peak)
- System tracks the **highest price** since the order was placed
- Stop price = highest price - trail amount (or highest price * (1 - trail%))
- Executes a market sell when current price **<= dynamic stop price**
- Shares are reserved when placed
- Auto-adjusts upward as stock price rises, never adjusts downward

### Time-in-Force Options
- **GTC (Good Till Cancel):** Order stays active until filled or manually cancelled. No expiry.
- **Day Order:** Order expires at market close (4:00 PM ET) on the day it's placed. Cron handles cleanup.

### Order Limits
- **Free users:** 5 pending orders maximum
- **Subscribers:** 15 pending orders maximum
- Limit counts all pending orders across all types

### Cash/Share Reservation System
When a pending order is placed:
- **Buy orders:** `reserved_cash = shares * limit_price` is deducted from `users.cash_balance` and added to a new `users.reserved_cash` column. Available cash = `cash_balance - reserved_cash`.
- **Sell orders:** Shares are marked as reserved in a new `reserved_shares` column on `holdings`. Available shares = `shares - reserved_shares`.

When an order is filled or cancelled:
- **Filled:** Reserved amounts are consumed (buy: cash spent, sell: shares sold)
- **Cancelled:** Reserved amounts are returned to available balance

### Execution Engine

#### On Page Visit (instant)
- When user loads dashboard, portfolio, or stock page → API call to `/api/orders/check`
- Fetches live quotes for all tickers with pending orders for this user
- Evaluates each order against current price
- Fills qualifying orders immediately
- Returns list of filled orders for toast notifications

#### Cron Job (every 15 min, market hours only)
- `GET /api/cron/orders` with bearer token auth
- Fetches all pending orders across all users
- Groups by ticker to minimize API calls
- Batch-fetches quotes (one per unique ticker, cached 60s)
- Evaluates all orders, fills qualifying ones
- Sends push notifications for fills
- Expires day orders after market close (4:00 PM ET)
- Updates trailing stop high-water marks

#### Fill Execution Logic
1. Fetch current quote
2. Check fill condition (limit, stop, or trailing stop)
3. Calculate actual fill: use **current market price** (not the limit price — limit orders get better fills if possible)
4. For buys: create holding or update existing (weighted average cost), create trade record
5. For sells: reduce or delete holding, credit cash, create trade record
6. Mark order as `filled`, record `filled_at` and `filled_price_cents`
7. Send push notification: "Your limit buy for AAPL filled at $149.50!"

### New Database Table

```sql
CREATE TABLE pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('limit_buy', 'limit_sell', 'stop_loss', 'trailing_stop')),
  time_in_force TEXT NOT NULL DEFAULT 'gtc' CHECK (time_in_force IN ('gtc', 'day')),

  -- Price conditions
  target_price_cents INTEGER, -- For limit and stop orders
  trail_amount_cents INTEGER, -- For trailing stop (dollar amount)
  trail_percent DECIMAL(5,2), -- For trailing stop (percentage, alternative to dollar)
  high_water_mark_cents INTEGER, -- For trailing stop (highest price seen)

  -- Quantity
  shares DECIMAL(10,6) NOT NULL,

  -- Reservation
  reserved_cash_cents INTEGER DEFAULT 0, -- Cash locked for buy orders

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'expired')),
  filled_price_cents INTEGER, -- Actual fill price
  filled_at TIMESTAMPTZ,
  trade_id UUID REFERENCES trades(id), -- Link to resulting trade

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ -- For day orders
);

CREATE INDEX idx_pending_orders_user ON pending_orders(user_id, status);
CREATE INDEX idx_pending_orders_status ON pending_orders(status, ticker);
```

### Schema Changes to Existing Tables

```sql
-- Add reserved_cash column to users
ALTER TABLE users ADD COLUMN reserved_cash INTEGER NOT NULL DEFAULT 0;

-- Add reserved_shares column to holdings
ALTER TABLE holdings ADD COLUMN reserved_shares DECIMAL(10,6) NOT NULL DEFAULT 0;
```

### UI Changes

#### Stock Detail Page (`/stock/[ticker]`)
- Buy/Sell buttons get a dropdown: "Market Order" / "Limit Order" / "Stop Loss" / "Trailing Stop"
- Limit order form: price input + shares/dollar input + GTC/Day toggle
- Stop loss form: stop price input + shares input
- Trailing stop form: trail amount ($ or %) + shares input
- Preview card showing: order type, ticker, shares, target price, estimated cost, time-in-force

#### New Orders Page (`/orders`)
- Tab on bottom nav or sidebar: "Orders" (replace nothing, add new)
- List of pending orders grouped by status (Pending, Filled Today, Cancelled/Expired)
- Each order card shows: ticker, type badge, target price, shares, created date, status
- Cancel button on pending orders (with confirmation)
- Filter by: All / Pending / Filled / Cancelled

#### Dashboard
- "Pending Orders" section below holdings (if any pending orders exist)
- Shows count badge on Orders nav item

### API Routes
- `POST /api/orders/create` — Place a new pending order
- `GET /api/orders` — List user's orders (with status filter)
- `POST /api/orders/cancel` — Cancel a pending order
- `GET /api/orders/check` — Check and fill pending orders (called on page visit)
- `GET /api/cron/orders` — Cron endpoint for periodic order checking

### Files to Create
- `src/app/api/orders/create/route.ts`
- `src/app/api/orders/route.ts` (GET — list orders)
- `src/app/api/orders/cancel/route.ts`
- `src/app/api/orders/check/route.ts`
- `src/app/api/cron/orders/route.ts`
- `src/lib/trading/order-engine.ts` — order evaluation and fill logic
- `src/lib/trading/reservations.ts` — cash/share reservation helpers
- `src/app/(dashboard)/orders/page.tsx` — orders page
- `src/components/trade/order-form.tsx` — limit/stop order form
- `src/components/trade/pending-orders-list.tsx` — pending orders display
- `src/components/trade/order-card.tsx` — single order card
- `supabase/migrations/007_pending_orders.sql`

### Files to Modify
- `src/app/(dashboard)/stock/[ticker]/page.tsx` — add order type selector to buy/sell
- `src/components/trade/buy-modal.tsx` — add limit order form option
- `src/components/trade/sell-modal.tsx` — add stop/trailing stop form option
- `src/app/(dashboard)/dashboard/page.tsx` — add pending orders section
- `src/components/layout/sidebar.tsx` — add Orders nav item
- `src/components/layout/bottom-nav.tsx` — add Orders nav item
- `src/app/api/trade/buy/route.ts` — check available cash (cash_balance - reserved_cash)
- `src/app/api/trade/sell/route.ts` — check available shares (shares - reserved_shares)
- `src/types/index.ts` — add PendingOrder type, OrderType updates
- `vercel.json` — add cron schedule for order checking

### Cron Configuration (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/snapshot",
      "schedule": "0 22 * * 1-5"
    },
    {
      "path": "/api/cron/orders",
      "schedule": "*/15 9-16 * * 1-5"
    }
  ]
}
```
- Runs every 15 minutes, 9 AM - 4 PM ET, Monday-Friday (market hours)

---

## Feature 5: Price Alerts

### Overview
Users can set price alerts on any stock. When the price crosses the target, they receive an in-app notification and a push notification. Alerts are checked alongside pending orders (same cron job and page-visit trigger).

### Alert Types
- **Price Above:** Triggers when current price >= target price
- **Price Below:** Triggers when current price <= target price

### Alert Limits
- **Free users:** 5 active alerts
- **Subscribers:** 15 active alerts

### Alert Lifecycle
1. User creates alert on stock detail page (target price + direction)
2. Alert stored as `active` in `price_alerts` table
3. On each price check (page visit or cron), evaluate all active alerts
4. When triggered: mark as `triggered`, create in-app notification, send push notification
5. Triggered alerts move to history (not deleted, can be viewed)

### In-App Notification System
- New `notifications` table stores all in-app notifications
- Bell icon in header with unread count badge
- Dropdown panel showing recent notifications (or dedicated `/notifications` route)
- Click notification → navigate to stock page
- Mark as read on click or "Mark all read" button

### New Database Tables

```sql
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below')),
  target_price_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'cancelled')),
  triggered_at TIMESTAMPTZ,
  triggered_price_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_user ON price_alerts(user_id, status);
CREATE INDEX idx_alerts_active ON price_alerts(status, ticker);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'price_alert', 'order_filled', 'achievement', 'streak_reminder'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT, -- deep link (e.g., /stock/AAPL)
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);
```

### API Routes
- `POST /api/alerts/create` — Create a new price alert
- `GET /api/alerts` — List user's alerts (active + recent triggered)
- `DELETE /api/alerts/[id]` — Cancel an active alert
- `GET /api/notifications` — List user's notifications (paginated)
- `POST /api/notifications/read` — Mark notification(s) as read

### UI Components
- Alert creation: button on stock detail page ("Set Alert") → modal with price input + above/below toggle
- Bell icon in header (from lucide-react `Bell` icon) with unread badge
- Notification dropdown: recent notifications with type icon, title, time ago, click to navigate
- Alerts management: section on stock detail page showing active alerts for that stock

### Files to Create
- `src/app/api/alerts/create/route.ts`
- `src/app/api/alerts/route.ts`
- `src/app/api/alerts/[id]/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/read/route.ts`
- `src/lib/alerts/engine.ts` — alert evaluation logic
- `src/components/market/alert-button.tsx` — "Set Alert" button + modal
- `src/components/notifications/notification-bell.tsx` — header bell icon + dropdown
- `src/components/notifications/notification-list.tsx` — notification items
- `supabase/migrations/008_alerts_notifications.sql`

### Files to Modify
- `src/app/(dashboard)/stock/[ticker]/page.tsx` — add alert button
- `src/components/layout/header.tsx` — add notification bell
- `src/app/api/cron/orders/route.ts` — also check price alerts in same cron
- `src/types/index.ts` — add PriceAlert, Notification types

---

## Feature 6: Achievements & Badges

### Overview
A set of 15 achievements that unlock automatically based on user activity. Each achievement awards tokens and optionally displays as a badge on the leaderboard. Unlocking triggers a confetti animation + toast notification + push notification.

### Achievement List

| ID | Name | Description | Condition | Tokens |
|----|------|-------------|-----------|--------|
| `first_trade` | First Steps | Execute your first trade | trades count >= 1 | 10 |
| `ten_trades` | Getting Started | Execute 10 trades | trades count >= 10 | 25 |
| `fifty_trades` | Active Trader | Execute 50 trades | trades count >= 50 | 50 |
| `hundred_trades` | Trading Machine | Execute 100 trades | trades count >= 100 | 100 |
| `first_profit` | In the Green | Close a trade with profit | any sell where sell_price > avg_cost | 15 |
| `thousand_profit` | Big Winner | Earn $1,000 in total profit | portfolio total P&L >= $1,000 | 50 |
| `five_k_profit` | Wolf of Paper Street | Earn $5,000 in total profit | portfolio total P&L >= $5,000 | 100 |
| `streak_7` | Week Warrior | Reach a 7-day login streak | current_streak >= 7 | 25 |
| `streak_30` | Monthly Master | Reach a 30-day login streak | current_streak >= 30 | 75 |
| `portfolio_15k` | Growing Portfolio | Portfolio value reaches $15,000 | total value >= 1,500,000 cents | 25 |
| `portfolio_20k` | Serious Investor | Portfolio value reaches $20,000 | total value >= 2,000,000 cents | 50 |
| `portfolio_50k` | Paper Millionaire (Almost) | Portfolio value reaches $50,000 | total value >= 5,000,000 cents | 100 |
| `diversifier` | Diversified | Own 5 different stocks simultaneously | holdings count >= 5 | 20 |
| `tutorial_complete` | Graduate | Complete all tutorial steps | tutorial completed_at IS NOT NULL | 10 |
| `first_limit` | Patient Trader | Place your first limit order | pending_orders count >= 1 (any status) | 15 |

### Achievement Checking
- Achievements are evaluated **after key actions**: trade execution, daily login, portfolio snapshot, tutorial completion, order placement
- A utility function `checkAndAwardAchievements(userId)` runs after these events
- Only checks unclaimed achievements (skip already-unlocked ones)
- Awards tokens + creates notification + sends push

### New Database Table

```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  tokens_earned INTEGER NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_achievements_user ON user_achievements(user_id);
```

### Achievement Definitions (code, not DB)
- Stored in `src/lib/game/achievements.ts` as a const array
- Each achievement has: id, name, description, icon, tokens, check function
- Check functions receive user context (profile, holdings, trades, etc.) and return boolean

### UI Components

#### Achievements Page (`/achievements`)
- Grid of achievement cards (3 cols desktop, 2 cols mobile)
- Each card: icon, name, description, token reward, locked/unlocked state
- Unlocked: full color with "Unlocked" badge and date
- Locked: greyed out with progress indicator (e.g., "3/10 trades")
- Progress bars where applicable (trade count, profit amount, streak days)

#### Leaderboard Badges
- Top 3 unlocked achievements displayed as small icons next to user name on leaderboard
- User can choose which 3 to display (future: settings page)

#### Unlock Celebration
- Full-screen confetti animation (use `canvas-confetti` package)
- Toast notification: "Achievement Unlocked: [Name]! +[tokens] tokens"
- Push notification if user is away

### API Routes
- `GET /api/achievements` — List all achievements with user's unlock status and progress
- `POST /api/achievements/check` — Manually trigger achievement check (called after key actions)

### Files to Create
- `src/lib/game/achievements.ts` — achievement definitions + check logic
- `src/app/api/achievements/route.ts`
- `src/app/api/achievements/check/route.ts`
- `src/app/(dashboard)/achievements/page.tsx`
- `src/components/achievements/achievement-card.tsx`
- `src/components/achievements/achievement-grid.tsx`
- `src/components/achievements/unlock-celebration.tsx` — confetti + toast
- `supabase/migrations/009_achievements.sql`

### Files to Modify
- `src/app/api/trade/buy/route.ts` — trigger achievement check after trade
- `src/app/api/trade/sell/route.ts` — trigger achievement check after trade
- `src/app/api/rewards/claim/route.ts` — trigger check after streak update
- `src/app/api/orders/create/route.ts` — trigger check after first order
- `src/app/(dashboard)/leaderboard/page.tsx` — show achievement badges
- `src/components/layout/sidebar.tsx` — add Achievements nav item
- `src/components/layout/bottom-nav.tsx` — add Achievements nav item (or reorganize)
- `src/types/index.ts` — add Achievement types

---

## Feature 7: UI Polish & Animations

### Overview
Enhance the existing UI with animated number counters, standardized loading states, page transitions, and celebratory micro-interactions. Keep the current dark theme — this is about adding motion and polish, not redesigning.

### Animated Number Counters
- **Where:** Portfolio total value, cash balance, P&L, token balance, leaderboard return %
- **How:** Create a reusable `<AnimatedNumber>` component that:
  - Smoothly interpolates from old value to new value over 500ms
  - Uses `requestAnimationFrame` for smooth 60fps animation
  - Formats as currency ($X,XXX.XX) or percentage (X.XX%)
  - Green flash on increase, red flash on decrease
  - Triggers on value change (prop comparison)

### Standardized Skeleton Loading
- Create a set of skeleton templates matching each page's layout:
  - `DashboardSkeleton` — matches portfolio summary + holdings + chart
  - `StockDetailSkeleton` — matches stock header + chart + stats + buttons
  - `LeaderboardSkeleton` — matches rank card + table rows
  - `RewardsSkeleton` — matches streak display + challenges
  - `AchievementsSkeleton` — matches achievement grid
  - `OrdersSkeleton` — matches order cards
- Use Next.js `loading.tsx` convention for route-level skeletons
- All skeletons use the existing `<Skeleton>` component with consistent spacing

### Page Transitions
- Use Framer Motion `AnimatePresence` for route transitions
- Subtle fade + slide-up animation (150ms) on page enter
- No exit animation (instant unmount — keeps navigation feeling fast)
- Apply to dashboard layout wrapper (affects all dashboard pages)

### Celebratory Micro-Interactions
- **Trade execution:** Brief green/red flash on the confirmation card (buy=green, sell=red)
- **Achievement unlock:** Full confetti burst (canvas-confetti, 2 seconds, then auto-cleanup)
- **Daily reward claim:** Coin animation (tokens flying into balance display)
- **Streak milestone:** Special animation at 7-day and 30-day marks
- **Leaderboard rank up:** Subtle glow animation when user's rank improves

### Button & Card Polish
- Add subtle hover scale (1.02) on interactive cards
- Button press effect (scale 0.98 on active)
- Tooltip animations (fade-in 100ms)
- Success/error state animations on forms

### New Dependencies
- `framer-motion` — page transitions + animations (already in project for onboarding)
- `canvas-confetti` — confetti effect for achievements

### Files to Create
- `src/components/ui/animated-number.tsx`
- `src/components/ui/confetti.tsx` — confetti trigger wrapper
- `src/app/(dashboard)/loading.tsx` — route-level skeleton
- `src/app/(dashboard)/dashboard/loading.tsx`
- `src/app/(dashboard)/explore/loading.tsx`
- `src/app/(dashboard)/stock/[ticker]/loading.tsx`
- `src/app/(dashboard)/leaderboard/loading.tsx`
- `src/app/(dashboard)/rewards/loading.tsx`
- `src/app/(dashboard)/achievements/loading.tsx`
- `src/app/(dashboard)/orders/loading.tsx`

### Files to Modify
- `src/app/(dashboard)/layout.tsx` — add page transition wrapper
- `src/components/portfolio/portfolio-summary.tsx` (or equivalent) — use AnimatedNumber
- `src/components/layout/header.tsx` — AnimatedNumber for token balance
- `src/components/rewards/streak-display.tsx` — add milestone animations
- Various card components — add hover/press micro-interactions

---

## Feature 8: Test Suite

### Overview
Comprehensive test coverage using Vitest for API routes, trading engine, game logic, and key UI components. Target: ~80% coverage on critical paths.

### Test Categories

#### API Route Tests (Integration)
Test each API route's request/response contract:
- `/api/trade/buy` — valid buy, insufficient cash, trade limit, invalid ticker
- `/api/trade/sell` — valid sell, insufficient shares, dust position
- `/api/orders/create` — limit buy, stop loss, trailing stop, order limit exceeded
- `/api/orders/cancel` — cancel pending, cancel already filled (error)
- `/api/orders/check` — fill limit buy, fill stop loss, no fills
- `/api/rewards/claim` — first claim, double claim, streak reset
- `/api/challenges/status` — progress calculation
- `/api/challenges/claim` — valid claim, already claimed
- `/api/alerts/create` — valid alert, alert limit exceeded
- `/api/achievements` — progress calculation
- `/api/gate/verify` — correct password, wrong password, rate limit
- `/api/account/delete` — valid deletion, wrong confirm name

#### Engine/Logic Unit Tests
- `src/lib/trading/engine.ts` — executeBuy, executeSell (mocked Supabase)
- `src/lib/trading/order-engine.ts` — evaluateOrder for each order type
- `src/lib/trading/reservations.ts` — reserve/release cash and shares
- `src/lib/trading/validation.ts` — trade validation rules
- `src/lib/trading/calculations.ts` — weighted average, P&L, portfolio value
- `src/lib/game/streaks.ts` — streak calculation (various date scenarios)
- `src/lib/game/rewards.ts` — reward tier calculation
- `src/lib/game/achievements.ts` — each achievement check function
- `src/lib/game/challenges.ts` — challenge progress calculation
- `src/lib/leaderboard/calculations.ts` — return %, display name, period dates
- `src/lib/rate-limit.ts` — rate limiting, eviction, cap
- `src/lib/alerts/engine.ts` — alert evaluation

#### Component Tests
- `LoginForm` — submit, validation, error display
- `SignupForm` — submit, password match validation
- `BuyModal` — input sync (dollars ↔ shares), validation, submit
- `SellModal` — input validation, max shares, submit
- `OrderForm` — limit price input, time-in-force toggle
- `AlertButton` — create alert flow
- `StreakDisplay` — correct day highlighting
- `AchievementCard` — locked vs unlocked state
- `AnimatedNumber` — renders formatted value
- `NotificationBell` — unread count badge

### Test Utilities
- `src/test/helpers.ts` — mock Supabase client, mock user factory, mock quote data
- `src/test/setup.ts` — Vitest global setup (environment, mocks)

### Files to Create
- `src/test/helpers.ts`
- `src/test/setup.ts`
- `src/lib/trading/engine.test.ts`
- `src/lib/trading/order-engine.test.ts`
- `src/lib/trading/reservations.test.ts`
- `src/lib/trading/validation.test.ts`
- `src/lib/trading/calculations.test.ts`
- `src/lib/game/streaks.test.ts`
- `src/lib/game/rewards.test.ts`
- `src/lib/game/achievements.test.ts`
- `src/lib/game/challenges.test.ts`
- `src/lib/leaderboard/calculations.test.ts`
- `src/lib/rate-limit.test.ts`
- `src/lib/alerts/engine.test.ts`
- `src/components/auth/login-form.test.tsx`
- `src/components/auth/signup-form.test.tsx`
- `src/components/trade/buy-modal.test.tsx`
- `src/components/trade/sell-modal.test.tsx`
- `src/components/trade/order-form.test.tsx`
- `src/components/market/alert-button.test.tsx`
- `src/components/rewards/streak-display.test.tsx`
- `src/components/achievements/achievement-card.test.tsx`
- `src/components/ui/animated-number.test.tsx`
- `src/components/notifications/notification-bell.test.tsx`
- Plus API route integration tests (co-located or in `src/app/api/*/route.test.ts`)

### Test Infrastructure
- `vitest.config.ts` — update if needed for path aliases, test environment
- `package.json` — add test scripts if not present
- Mock factories for: Supabase client, auth user, stock quotes, portfolio data

---

## New Database Tables Summary

| Table | Feature | Purpose |
|-------|---------|---------|
| `weekly_challenge_claims` | F2 | Track weekly challenge reward claims |
| `push_subscriptions` | F3 | Store device push notification subscriptions |
| `pending_orders` | F4 | Limit/stop/trailing stop orders |
| `price_alerts` | F5 | User price alert configurations |
| `notifications` | F5 | In-app notification inbox |
| `user_achievements` | F6 | Track unlocked achievements |

### Schema Changes to Existing Tables
| Table | Column | Feature | Purpose |
|-------|--------|---------|---------|
| `users` | `reserved_cash` (INTEGER) | F4 | Cash locked by pending buy orders |
| `holdings` | `reserved_shares` (DECIMAL) | F4 | Shares locked by pending sell/stop orders |

---

## New Environment Variables Summary

| Variable | Feature | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | F3 | Client-side push subscription |
| `VAPID_PRIVATE_KEY` | F3 | Server-side push sending |
| `VAPID_SUBJECT` | F3 | VAPID identification (mailto: or URL) |

---

## New Dependencies

| Package | Feature | Purpose |
|---------|---------|---------|
| `web-push` | F3 | Server-side push notification sending |
| `canvas-confetti` | F6, F7 | Confetti animation for celebrations |
| `framer-motion` | F7 | Page transitions (may already be installed) |

---

## Navigation Updates

Current bottom nav (5 items): Dashboard, Explore, Rewards, Leaderboard, Settings

Proposed bottom nav (5 items): Dashboard, Explore, **Orders**, Rewards, **More**

The "More" item opens a sheet/menu with: Leaderboard, Achievements, Settings

This keeps the bottom nav to 5 items (mobile UX best practice) while adding new sections.

Sidebar (desktop) can show all items since there's more space:
Dashboard, Explore, Orders, Rewards, Leaderboard, Achievements, Settings
