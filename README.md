# PaperTrade — AI-Powered Stock Market Simulator

A gamified stock market simulation platform where users trade with fake money using real market data. Mobile-first, aimed at teens and young adults who want to learn investing without risking capital.

## Features

- **Paper Trading** — Buy and sell stocks with $10,000 in simulated cash using real-time market data
- **Fractional Shares** — Trade any dollar amount or share quantity with bidirectional input sync
- **Interactive Charts** — Lightweight Charts (TradingView) with 1D/1W/1M/3M/1Y/ALL ranges, crosshair tooltips, and full trading-day display
- **Stock Discovery** — Explore page with curated watchlists (Trending, Beginner Friendly, Tech Giants), category filters, and search
- **Key Statistics** — Market cap, P/E ratio, 52-week range, volume, dividend yield, and EPS on every stock page
- **Portfolio Dashboard** — Holdings list, enhanced allocation donut chart with hover details and center total value
- **Leaderboard** — Ranked by return percentage with daily, weekly, and all-time period filtering
- **Gamification** — Daily login streaks, token rewards, weekly challenges, and a 5-step tutorial quest system
- **AI Trade Coach** — Claude-powered analysis of every trade with risk assessment and educational insights
- **Responsive Design** — Mobile-first with sidebar navigation on desktop and bottom nav on mobile

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
| Deployment | [Vercel](https://vercel.com/) |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project
- (Optional) [Anthropic API key](https://console.anthropic.com/) for AI trade coaching

### Setup

```bash
# Clone and install
git clone <repo-url>
cd paper-trading-app
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL, anon key, and service role key

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
| `CRON_SECRET` | No | Bearer token for scheduled snapshot cron job |

## Project Structure

```
src/
├── app/
│   ├── (auth)/             # Login, signup, onboarding
│   ├── (dashboard)/        # Dashboard, explore, stock, trade, rewards, leaderboard, settings
│   └── api/                # API routes (trade, market, rewards, leaderboard, tutorial, cron)
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── trade/              # Buy/sell modals with bidirectional sync
│   ├── market/             # Stock chart, stats, curated watchlists
│   ├── portfolio/          # Holdings, allocation chart
│   ├── rewards/            # Streak display, daily reward modal, token balance
│   └── layout/             # Sidebar, header, bottom nav, profile initializer
├── lib/
│   ├── supabase/           # Server, client, admin, middleware, auth helpers
│   ├── market/             # Yahoo Finance integration, watchlist data
│   ├── trading/            # Trade execution engine
│   ├── leaderboard/        # Period return calculations
│   ├── game/               # Rewards, streaks, tutorial logic
│   └── ai/                 # Anthropic Claude integration
├── stores/                 # Zustand stores (portfolio, trade, profile)
└── types/                  # Shared TypeScript types
```

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # Run ESLint
npm run start     # Start production server
```

## Database

The app uses 8 tables in Supabase with Row Level Security (RLS) enabled on all:

- `users` — Profile, cash balance, tokens, streak
- `holdings` — Current stock positions (fractional shares)
- `trades` — Complete trade history with AI analysis
- `daily_rewards` — Reward claim log
- `token_transactions` — Token earn/spend audit trail
- `leaderboard_cache` — Precomputed leaderboard rankings
- `portfolio_snapshots` — Daily portfolio value snapshots (for period returns)
- `tutorial_progress` — Tutorial quest completion state

Migrations are in `supabase/migrations/`.

## Architecture Notes

- All monetary values stored as **integers (cents)** in the database
- Shares stored as **decimal(10,6)** to support fractional trading
- Stock prices cached for 1 minute to avoid Yahoo Finance rate limits
- Trade execution uses **optimistic locking** on cash balance to prevent double-spend
- Server components fetch data; client components hydrate via Zustand stores
- Profile state (display name, token balance) bridges server-to-client via `ProfileInitializer`

## License

Private — not for redistribution.
