# paper-trading-app — Product Specification

## Overview
A mobile-first web app where users simulate stock market trading using real market data and fake money. It gamifies the experience with daily rewards, streaks, leaderboards, and an AI coach that explains what happened after each trade. Working name — will be rebranded later.

---

## Core Features (MVP — Phase 1)

### 1. Authentication & Onboarding
- Sign up / log in via email + password (Supabase Auth)
- Google OAuth as secondary option
- Onboarding flow: pick a display name, get introduced to the app (3 swipeable screens), receive starting balance of $10,000 simulated cash

### 2. Market Data & Stock Explorer
- Pull real stock prices using yahoo-finance2
- Stock explorer page: search stocks by ticker or name
- Stock detail page showing:
  - Current price, daily change ($ and %)
  - Interactive price chart (1D, 1W, 1M, 3M, 1Y, ALL)
  - Company name and basic info
  - Buy button
- Cache prices for 60 seconds to avoid rate limiting
- Curated watchlists for beginners: "Tech Giants", "Popular Picks", "S&P 500 Top 10"

### 3. Trading Engine
- Buy and sell stocks at current market price (simulated market orders)
- **Fractional shares supported** — users can buy by dollar amount (e.g., "$50 of AAPL") and the system calculates fractional shares. Minimum buy: $1.
- Portfolio tracks: ticker, shares owned (decimal), average cost basis, current value, P&L
- Trade limits:
  - Free users: 2 trades/day
  - Subscribers: 6 trades/day
- Trade confirmation screen showing: ticker, shares (up to 6 decimal places), price, total cost, remaining balance
- Trade history log with timestamps

### 4. Portfolio Dashboard
- Total portfolio value (cash + holdings)
- Daily P&L, total P&L
- Holdings list with per-stock performance
- Portfolio allocation pie chart
- Performance chart over time (line chart)

### 5. Daily Rewards & Engagement
- Daily login streak tracker
- Daily reward: earn tokens (credits) for logging in
  - Day 1: 10 tokens
  - Day 2: 15 tokens
  - Day 3-6: 20 tokens
  - Day 7 (weekly): 50 tokens
  - Streak resets if you miss a day
- Weekly challenge: e.g., "Make 3 trades this week" → bonus tokens
- Token balance displayed in header/nav

### 6. AI Trade Coach
- After each trade executes, queue an AI analysis (async, non-blocking)
- AI explains in plain language:
  - What the stock has been doing recently
  - Why it might have moved
  - What to watch for going forward
- Display as a chat-bubble style card on the trade confirmation / portfolio page
- Use Claude claude-sonnet-4-5-20250929 via Anthropic API
- System prompt: "You are a friendly stock market coach explaining trades to beginners. Keep it under 100 words. No financial advice disclaimers — this is a simulation."

### 7. Leaderboard
- Global leaderboard ranked by total portfolio return (%)
- Show: rank, display name, return %, badge (if subscriber)
- Updated hourly (not real-time)
- Filter: daily, weekly, all-time

---

## Database Schema

### users (extends Supabase auth.users)
- id (uuid, FK to auth.users)
- display_name (text)
- cash_balance (integer, cents — default 1000000 = $10,000)
- token_balance (integer, default 0)
- is_subscriber (boolean, default false)
- current_streak (integer, default 0)
- last_login_date (date)
- trades_today (integer, default 0)
- trades_today_date (date)
- created_at (timestamptz)

### holdings
- id (uuid)
- user_id (uuid, FK)
- ticker (text)
- shares (decimal, precision 10 scale 6 — supports fractional shares)
- avg_cost_cents (integer)
- created_at (timestamptz)
- updated_at (timestamptz)

### trades
- id (uuid)
- user_id (uuid, FK)
- ticker (text)
- type (enum: 'buy', 'sell')
- shares (decimal, precision 10 scale 6 — supports fractional shares)
- price_cents (integer)
- total_cents (integer)
- ai_analysis (text, nullable — filled async)
- created_at (timestamptz)

### daily_rewards
- id (uuid)
- user_id (uuid, FK)
- reward_date (date)
- tokens_earned (integer)
- streak_day (integer)
- created_at (timestamptz)

### leaderboard_cache
- user_id (uuid, FK)
- display_name (text)
- total_return_pct (decimal)
- is_subscriber (boolean)
- updated_at (timestamptz)

---

## Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (marketing, sign up CTA) |
| `/login` | Login |
| `/signup` | Sign up |
| `/onboarding` | Post-signup onboarding flow |
| `/dashboard` | Portfolio dashboard (main screen) |
| `/explore` | Stock explorer / search |
| `/stock/[ticker]` | Stock detail + buy |
| `/trade/[id]` | Trade confirmation + AI analysis |
| `/rewards` | Daily rewards, streaks, token balance |
| `/leaderboard` | Global leaderboard |
| `/settings` | Account settings |

---

## UI/UX Guidelines

- **Mobile-first**: Design for 375px width first, then scale up
- **Bottom navigation bar** (mobile): Dashboard, Explore, Trade, Rewards, Profile
- **Color scheme**: Dark mode default (dark navy/charcoal background, green for gains, red for losses, accent blue/purple for CTAs)
- **Typography**: Inter font, clean and modern
- **Animations**: Subtle transitions on page changes, number animations on P&L changes
- **Cards**: Rounded corners (12-16px), subtle borders, no heavy shadows
- **The vibe**: Should feel like a game, not a Bloomberg terminal. Think Robinhood meets Duolingo.

---

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/market/quote/[ticker]` | GET | Get current stock price (cached) |
| `/api/market/search` | GET | Search stocks by query |
| `/api/market/chart/[ticker]` | GET | Get price history for charts |
| `/api/trade/buy` | POST | Execute buy order |
| `/api/trade/sell` | POST | Execute sell order |
| `/api/trade/[id]/analysis` | GET | Get/trigger AI analysis for a trade |
| `/api/portfolio` | GET | Get user's portfolio |
| `/api/rewards/claim` | POST | Claim daily reward |
| `/api/rewards/status` | GET | Get streak/reward status |
| `/api/leaderboard` | GET | Get leaderboard data |
