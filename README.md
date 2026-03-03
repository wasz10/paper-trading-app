# PaperTrade — AI-Powered Stock Market Simulator

A gamified stock market simulation platform where users trade with fake money using real market data. Mobile-first, aimed at teens and young adults who want to learn investing without risking capital.

## Features

### Core Trading
- **Paper Trading** — Buy and sell stocks with $10,000 in simulated cash using real-time market data
- **Fractional Shares** — Trade any dollar amount or share quantity with bidirectional input sync
- **Limit / Stop / Trailing Stop Orders** — Place conditional orders that execute automatically via cron when target prices are hit
- **Interactive Charts** — Lightweight Charts (TradingView) with 1D/1W/1M/3M/1Y/ALL ranges, crosshair tooltips, and full trading-day display
- **Stock Discovery** — Explore page with curated watchlists (Trending, Beginner Friendly, Tech Giants), category filters, and search
- **Key Statistics** — Market cap, P/E ratio, 52-week range, volume, dividend yield, and EPS on every stock page

### Portfolio & Leaderboard
- **Portfolio Dashboard** — Holdings list, enhanced allocation donut chart with hover details and center total value
- **Leaderboard** — Ranked by return percentage with daily, weekly, and all-time period filtering

### Gamification
- **Daily Login Streaks** — Streak tracker with token rewards (10-50 tokens/day based on streak length)
- **Weekly Challenges** — Time-limited goals (e.g. "Make 3 trades this week") with bonus token rewards and progress tracking
- **Achievements & Badges** — 15 unlockable achievements across trading, profit, streak, portfolio, and misc categories with token rewards
- **Tutorial Quest** — 5-step guided onboarding quest system
- **Price Alerts** — Set above/below price alerts with in-app and push notifications when triggered

### AI & Intelligence
- **AI Trade Coach** — Claude-powered analysis of every trade with risk assessment and educational insights

### Authentication & Security
- **Google OAuth + Email/Password** — Dual auth with refreshed login UI
- **Site Password Gate** — Optional private-beta password wall using HMAC-SHA256 cookie validation in middleware
- **Account Deletion** — Cascade delete across all tables with type-to-confirm safety dialog

### PWA & Notifications
- **Installable PWA** — Web app manifest, service worker with offline fallback, add-to-homescreen support
- **Push Notifications** — Web Push API integration for price alerts, order fills, and achievement unlocks
- **In-App Notification Bell** — Notification center with read/unread state

### UI Polish
- **Animated Numbers** — Smooth count-up/down transitions on values via `AnimatedNumber` component
- **Confetti Effects** — Celebration animations on achievements, rewards, and milestones
- **Loading Skeletons** — Shimmer placeholders throughout the app during data fetches
- **Page Transitions** — Framer Motion page-level enter/exit animations
- **Responsive Design** — Mobile-first with sidebar navigation on desktop and bottom nav on mobile

### Developer Tools
- **Developer Panel** — URL-only `/dev` page with state manipulation tools (tokens, cash, streak, snapshot, tutorial, reset), gated by env var + email allowlist
- **Test Suite** — 67 unit tests via Vitest covering trade calculations, order engine, alerts engine, rewards, streaks, rate limiting, and leaderboard calculations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript (strict mode) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Database | [Supabase](https://supabase.com/) (PostgreSQL + Auth + RLS) |
| Market Data | [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2) |
| AI | [Anthropic Claude API](https://docs.anthropic.com/) |
| State | [Zustand](https://zustand-demo.pmnd.rs/) |
| Stock Charts | [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) v4 |
| Portfolio Charts | [Recharts](https://recharts.org/) |
| Animations | [Framer Motion](https://www.framer.com/motion/) + [canvas-confetti](https://github.com/catdad/canvas-confetti) |
| Push Notifications | [web-push](https://github.com/web-push-libs/web-push) |
| Testing | [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) |
| Deployment | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- (Optional) [Anthropic API key](https://console.anthropic.com/) for AI trade coaching
- (Optional) VAPID keys for push notifications — generate with `npx web-push generate-vapid-keys`

### Setup

```bash
# Clone and install
git clone <repo-url>
cd paper-trading-app
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your keys (see Environment Variables below)

# Push database schema
npx supabase db push

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for AI trade coach |
| `CRON_SECRET` | No | Bearer token for scheduled cron jobs (snapshot, orders, alerts) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | VAPID public key for push notifications |
| `VAPID_PRIVATE_KEY` | No | VAPID private key for push notifications (server-only) |
| `VAPID_SUBJECT` | No | VAPID subject (e.g. `mailto:you@example.com`) |
| `SITE_PASSWORD` | No | Password to gate entire site (leave empty to disable) |
| `DEV_PANEL_ENABLED` | No | Set to `true` to enable `/dev` tools page |
| `DEV_ALLOWED_EMAILS` | No | Comma-separated emails allowed to use dev panel |

## Project Structure

```
src/
├── app/
│   ├── (auth)/                # Login, signup, onboarding, OAuth callback
│   ├── (dashboard)/
│   │   ├── dashboard/         # Portfolio dashboard
│   │   ├── explore/           # Stock discovery & search
│   │   ├── stock/[ticker]/    # Stock detail page
│   │   ├── trade/[id]/        # Trade confirmation + AI analysis
│   │   ├── orders/            # Pending orders management
│   │   ├── rewards/           # Daily rewards & weekly challenges
│   │   ├── achievements/      # Achievement badges gallery
│   │   ├── leaderboard/       # Global leaderboard
│   │   ├── settings/          # Account settings & deletion
│   │   └── dev/               # Developer tools panel
│   ├── gate/                  # Site password gate page
│   └── api/
│       ├── trade/             # Buy/sell execution
│       ├── market/            # Quotes, search, chart data
│       ├── orders/            # Pending order CRUD
│       ├── alerts/            # Price alert CRUD
│       ├── achievements/      # Achievement check & claim
│       ├── challenges/        # Weekly challenge progress & claims
│       ├── notifications/     # Notification list, push subscription
│       ├── rewards/           # Daily reward claim & status
│       ├── leaderboard/       # Leaderboard data
│       ├── tutorial/          # Tutorial quest progress
│       ├── portfolio/         # Portfolio snapshot data
│       ├── cron/
│       │   ├── snapshot/      # Daily portfolio snapshot (10 PM UTC)
│       │   ├── orders/        # Pending order execution (every 15 min, market hours)
│       │   └── alerts/        # Price alert checking (every 15 min, market hours)
│       ├── gate/              # Site password verification
│       ├── dev/               # Dev panel actions
│       └── account/           # Account deletion
├── components/
│   ├── ui/                    # shadcn/ui base + AnimatedNumber, confetti, skeleton
│   ├── auth/                  # OAuth buttons, login forms
│   ├── trade/                 # Buy/sell modals with bidirectional sync
│   ├── market/                # Stock chart, stats, curated watchlists
│   ├── portfolio/             # Holdings, allocation chart
│   ├── rewards/               # Streak display, daily reward modal, challenge cards
│   ├── notifications/         # Notification bell, push prompt
│   ├── leaderboard/           # Leaderboard table
│   ├── layout/                # Sidebar, header, bottom nav, profile initializer, page transitions
│   ├── ai/                    # AI coach chat bubble
│   ├── landing/               # Landing page sections
│   └── tutorial/              # Tutorial quest components
├── lib/
│   ├── supabase/              # Server, client, admin, middleware, auth helpers
│   ├── market/                # Yahoo Finance integration, watchlist data
│   ├── trading/               # Trade execution engine, order engine, calculations
│   ├── alerts/                # Price alert checking engine
│   ├── notifications/         # Push notification sender
│   ├── leaderboard/           # Period return calculations
│   ├── game/                  # Rewards, streaks, challenges, achievements, tutorial
│   ├── ai/                    # Anthropic Claude integration
│   ├── crypto.ts              # HMAC-SHA256 utilities
│   ├── dev-guard.ts           # Dev panel authorization
│   ├── rate-limit.ts          # In-memory rate limiter
│   └── utils.ts               # cn() and shared utilities
├── stores/                    # Zustand stores (portfolio, trade, profile)
└── types/                     # Shared TypeScript types
```

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Run ESLint
npm run start     # Start production server
npx vitest        # Run test suite (watch mode)
npx vitest run    # Run tests once
```

## Database

The app uses 14 tables in Supabase with Row Level Security (RLS) enabled on all:

| Table | Description |
|-------|-------------|
| `users` | Profile, cash balance, tokens, streak |
| `holdings` | Current stock positions (fractional shares) |
| `trades` | Complete trade history with AI analysis |
| `daily_rewards` | Reward claim log |
| `token_transactions` | Token earn/spend audit trail |
| `leaderboard_cache` | Precomputed leaderboard rankings |
| `portfolio_snapshots` | Daily portfolio value snapshots (for period returns) |
| `tutorial_progress` | Tutorial quest completion state |
| `weekly_challenge_claims` | Weekly challenge completion records |
| `push_subscriptions` | Web Push subscription endpoints per user |
| `pending_orders` | Limit, stop-loss, and trailing-stop orders awaiting execution |
| `price_alerts` | User-defined price alerts (above/below conditions) |
| `notifications` | In-app notification inbox |
| `user_achievements` | Unlocked achievements per user with timestamps |

Migrations are in `supabase/migrations/` (001 through 009).

## Cron Jobs (Vercel)

Configured in `vercel.json`:

| Schedule | Path | Description |
|----------|------|-------------|
| `0 22 * * *` | `/api/cron/snapshot` | Daily portfolio snapshots at 10 PM UTC |
| `*/15 14-21 * * 1-5` | `/api/cron/orders` | Execute pending orders every 15 min during US market hours (Mon-Fri) |
| `*/15 14-21 * * 1-5` | `/api/cron/alerts` | Check price alerts every 15 min during US market hours (Mon-Fri) |

All cron endpoints are protected by the `CRON_SECRET` bearer token.

## Architecture Notes

- All monetary values stored as **integers (cents)** in the database
- Shares stored as **decimal(10,6)** to support fractional trading
- Stock prices cached for 1 minute to avoid Yahoo Finance rate limits
- Trade execution uses **optimistic locking** on cash balance to prevent double-spend
- Server components fetch data; client components hydrate via Zustand stores
- Profile state (display name, token balance) bridges server-to-client via `ProfileInitializer`
- **Pending orders** reserve cash at creation time and execute atomically when price conditions are met
- **Trailing stop orders** track a high-water mark and trigger when price drops by the trail amount/percent
- **Price alerts** are evaluated by the cron job; triggered alerts generate both in-app notifications and push notifications
- **Achievements** are checked after trade execution and on-demand; 15 achievements across 5 categories (trading, profit, streak, portfolio, misc)
- **PWA** uses a custom service worker (`public/sw.js`) with cache-first strategy and offline fallback page
- **Push notifications** use the Web Push protocol (VAPID) via the `web-push` library; subscriptions stored per-user in Supabase
- **Site password gate** runs in Edge middleware before auth, using HMAC-SHA256 cookie + rate limiting
- **Dev panel** guarded by `DEV_PANEL_ENABLED` env var + optional `DEV_ALLOWED_EMAILS` email allowlist
- Account deletion cascades through all 14 tables before deleting the auth user, aborting on failure

## Testing

67 unit tests covering core business logic:

- `src/lib/trading/calculations.test.ts` — Trade cost/proceeds/P&L calculations
- `src/lib/trading/order-engine.test.ts` — Limit, stop-loss, trailing-stop order evaluation
- `src/lib/alerts/engine.test.ts` — Price alert condition checking
- `src/lib/game/rewards.test.ts` — Daily reward token calculations
- `src/lib/game/streaks.test.ts` — Streak increment, reset, and edge cases
- `src/lib/leaderboard/calculations.test.ts` — Return percentage calculations
- `src/lib/rate-limit.test.ts` — Rate limiter behavior

Run with `npx vitest run` or `npx vitest` for watch mode.

## License

Private — not for redistribution.
