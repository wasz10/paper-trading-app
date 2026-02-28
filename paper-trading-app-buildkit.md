# paper-trading-app — Claude Code Build Kit

> **What this is:** Everything you need to hand to Claude Code to build your gamified stock market simulator. Copy these files into your project, enable agent teams, and run the kickoff prompt.
> 
> **Repo name:** `paper-trading-app`  
> **Description:** Gamified stock market simulator with real market data, AI coaching, and daily rewards

---

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [CLAUDE.md (Project Brain)](#2-claudemd)
3. [SPEC.md (Full Product Spec)](#3-specmd)
4. [Kickoff Prompt (Paste This First)](#4-kickoff-prompt)
5. [Agent Team Strategy](#5-agent-team-strategy)
6. [Suggestions & Architecture Decisions](#6-suggestions--architecture-decisions)

---

## 1. Prerequisites & Setup

### Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
```

### Enable Agent Teams
```bash
# Add to your environment
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Or add to ~/.claude/settings.json
{
  "experimental": {
    "agentTeams": true
  }
}
```

### Create Your Project
```bash
mkdir paper-trading-app && cd paper-trading-app
git init
```

### Copy the files below into your project root:
- `CLAUDE.md` → project root
- `SPEC.md` → project root

Then open Claude Code in the project directory and paste the Kickoff Prompt.

### Build Approach
Build locally first — don't deploy until the core loop feels solid (explore → buy → portfolio → AI explains). First impressions are permanent, especially if you're marketing on TikTok later. Deploy to Vercel once you're happy with the mobile experience.

### Tips If You're Newer to Claude Code
- **Don't skip Plan Mode.** The kickoff prompt forces Claude to interview you before coding. This is where you catch bad assumptions.
- **One phase at a time.** After each phase completes, run `/clear` to reset context before starting the next one. This keeps Claude focused.
- **Use `/compact` if context gets long.** If you're deep in a phase and Claude starts forgetting things, hit `/compact` to summarize and free up space.
- **`Esc` is your best friend.** If Claude starts going in a wrong direction, hit Esc immediately. Don't let it keep going.
- **Commit after every phase.** `git add . && git commit -m "feat: phase X complete"` — this gives you rollback points.
- **Use Sonnet for implementation, Opus for architecture.** Start with `claude --model opus` for the planning phase, then switch to `claude --model sonnet` for routine implementation to save money.

---

## 2. CLAUDE.md

> Copy everything between the `---` markers below into a file called `CLAUDE.md` at your project root.

---

```markdown
# paper-trading-app — AI-Powered Stock Market Simulator

## What This Is
A gamified stock market simulation platform where users trade with fake money using real market data. Mobile-first, aimed at teens and young adults who want to learn investing without risking capital.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Market Data:** Yahoo Finance API (via yahoo-finance2 npm package) — free, no API key needed
- **AI Features:** Anthropic Claude API (claude-sonnet-4-5-20250929) for trade analysis/coaching
- **State Management:** Zustand
- **Charts:** Lightweight Charts (TradingView open-source) for stock charts, Recharts for portfolio
- **Deployment:** Vercel

## Project Structure
```
paper-trading-app/
├── CLAUDE.md
├── SPEC.md
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login, signup, onboarding
│   │   ├── (dashboard)/        # Main app (portfolio, trade, explore)
│   │   ├── api/                # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── trade/              # Trading-specific components
│   │   ├── portfolio/          # Portfolio display components
│   │   ├── rewards/            # Dailies, streaks, tokens
│   │   └── ai/                 # AI coach/advisor components
│   ├── lib/
│   │   ├── supabase/           # Supabase client, types, queries
│   │   ├── market/             # Market data fetching & caching
│   │   ├── ai/                 # Anthropic API integration
│   │   ├── game/               # Game logic (rewards, limits, tokens)
│   │   └── utils.ts
│   ├── stores/                 # Zustand stores
│   └── types/                  # Shared TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
└── public/
```

## Code Style
- Use ES modules (import/export), never CommonJS
- Functional components with hooks, no class components
- Prefer named exports for components, default export only for pages
- Use `cn()` utility from lib/utils for conditional classNames
- All API routes return typed responses using shared types from `src/types/`
- Prefer server components; mark client components with 'use client' only when needed
- Use Supabase Row Level Security (RLS) for all database access

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx supabase db push` — push migrations
- `npx supabase gen types typescript --local > src/lib/supabase/types.ts` — generate DB types

## Key Conventions
- Mobile-first responsive design (min-width breakpoints: sm, md, lg)
- All monetary values stored as integers (cents) in the database
- Shares stored as decimal (precision 10, scale 6) to support fractional shares
- Stock prices cached for 1 minute to avoid API rate limits
- User's simulated cash balance starts at $10,000
- Maximum 2 trades per day for free users, 6 for subscribers
- AI analysis calls should be non-blocking (fire and forget, show when ready)
- Use optimistic UI updates for trade execution

## Testing
- Vitest for unit tests
- Test files co-located: `Component.test.tsx` next to `Component.tsx`
- Run single test: `npx vitest run src/path/to/file.test.tsx`

## Git Workflow
- Create a feature branch for each task
- Commit frequently with conventional commit messages (feat:, fix:, chore:)
- Never commit directly to main
```

---

## 3. SPEC.md

> Copy everything between the `---` markers below into a file called `SPEC.md` at your project root.

---

```markdown
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
```

---

## 4. Kickoff Prompt

> This is what you paste into Claude Code after setting up the project with the CLAUDE.md and SPEC.md files above.

---

```
I want to build a gamified stock market simulator (working name: paper-trading-app). Read @CLAUDE.md for project context and @SPEC.md for the full product specification.

Before writing any code, switch to Plan Mode and interview me about anything unclear in the spec. Dig into:
- Edge cases in the trading engine
- How I want the AI coach to feel
- Any preferences on the landing page
- Anything you think I haven't considered

After we align on the plan, write a detailed implementation plan to PLAN.md broken into phases:

Phase 1: Project scaffolding + database setup
Phase 2: Auth + onboarding
Phase 3: Market data integration + stock explorer
Phase 4: Trading engine + portfolio
Phase 5: Daily rewards + tokens
Phase 6: AI trade coach
Phase 7: Leaderboard
Phase 8: Landing page + polish

Each phase should list specific files to create/modify and acceptance criteria.

Do NOT start coding until I approve the plan.
```

---

## 5. Agent Team Strategy

Once the plan is approved and Phase 1 (scaffolding) is done, you can use agent teams to parallelize the heavier phases. Here's how:

### When to Use Agent Teams

**Phases 2-4 can run in parallel** once the database schema and project structure are in place. This is where agent teams shine:

```
Now that scaffolding is complete and the database is set up, I want to parallelize the next phases using agent teams.

Spawn a team of 3 teammates:

1. **auth-agent**: Owns Phase 2 — Authentication & Onboarding
   - Supabase Auth setup (email + Google OAuth)
   - Login/signup pages
   - Onboarding flow with swipeable screens
   - Protected route middleware
   - Files: src/app/(auth)/*, src/lib/supabase/auth.ts, middleware.ts

2. **market-agent**: Owns Phase 3 — Market Data & Stock Explorer
   - yahoo-finance2 integration with caching layer
   - API routes for quotes, search, charts
   - Stock explorer page with search
   - Stock detail page with TradingView Lightweight Charts
   - Files: src/lib/market/*, src/app/api/market/*, src/app/(dashboard)/explore/*, src/app/(dashboard)/stock/*

3. **trade-agent**: Owns Phase 4 — Trading Engine & Portfolio
   - Buy/sell API routes with validation and limits
   - Portfolio dashboard with holdings, P&L, charts
   - Trade confirmation page
   - Trade history
   - Zustand stores for portfolio state
   - Files: src/app/api/trade/*, src/app/(dashboard)/dashboard/*, src/stores/*, src/components/portfolio/*

Rules:
- Each agent works ONLY in its designated files/directories — no overlapping
- All agents share the database schema from Phase 1 and types from src/types/
- Auth-agent should finish first since other features need protected routes
- Market-agent and trade-agent can work in parallel once auth middleware exists
- Each agent must run `npm run build` to verify no type errors before marking complete
```

### For Phase 5-7 (Sequential but Subagent-Friendly)

These are smaller and more sequential, so use regular subagents or single-session work:

```
Phase 5 (Rewards) depends on auth being done.
Phase 6 (AI Coach) depends on the trading engine being done.
Phase 7 (Leaderboard) depends on portfolio data existing.

For each of these, work in a single session or use a subagent for the AI integration piece (Phase 6) since it's an isolated module.
```

### For Phase 8 (Polish) — Agent Team QA Swarm

```
Spawn a QA team to review the entire app:

1. **ui-reviewer**: Check all pages for mobile responsiveness, dark mode consistency, and visual polish
2. **logic-reviewer**: Test trading engine edge cases (insufficient funds, trade limits, selling more than owned, etc.)
3. **perf-reviewer**: Check for unnecessary re-renders, missing caching, bundle size, Lighthouse score

Each reviewer should file issues as TODO comments in the code and create a REVIEW.md with findings.
```

---

## 6. Suggestions & Architecture Decisions

### Things I'd Recommend Adding to Your MVP

**1. Portfolio Snapshots for Historical Charts**
Create a cron job (Vercel Cron or Supabase Edge Function) that snapshots each user's total portfolio value once daily. This powers the "portfolio over time" chart. Without it, you can only show current state.

**2. Stock Categories / Tags**
Instead of just search, give users curated lists: "Tech", "Healthcare", "Meme Stocks", "Dividends". This helps beginners who don't know any tickers. Makes the explore page way more browsable.

**3. Simulated Order Types (Future)**
Start with market orders only, but architect the trading engine so you can add limit orders and stop-losses later. Use a `type` field on trades that defaults to `'market'` but can support `'limit'`, `'stop'`.

### Why This Tech Stack

| Choice | Why |
|--------|-----|
| **Next.js 15** | App Router gives you server components (fast initial load), API routes (no separate backend), and Vercel deployment is one-click |
| **Supabase** | Free tier is generous, gives you PostgreSQL + auth + realtime subscriptions + edge functions in one package. Perfect for MVPs. |
| **yahoo-finance2** | Free, no API key needed, good enough for simulation. Can swap to Finnhub or Polygon.io later if you need websocket real-time data. |
| **Tailwind + shadcn/ui** | Fastest way to build a polished UI. shadcn components are copy-paste (not a dependency), so you own the code and can customize everything. |
| **Zustand** | Lightest state management for React. No boilerplate. Perfect for portfolio state that needs to update across components. |
| **TradingView Lightweight Charts** | The same charts Robinhood-style apps use. Open source, tiny bundle, beautiful out of the box. |

### On the Business Model (For Later)

Don't build subscription logic now. Just add an `is_subscriber` boolean to the user table and hardcode it to `false`. When you're ready, plug in Stripe Checkout — it integrates with Next.js in about 30 minutes. The trade limit logic (2 vs 6 trades/day) is already in the spec, so when you flip `is_subscriber` to `true`, everything just works.

### On the Token Economy (For Later)

Tokens are in the spec as a simple integer balance. Don't over-engineer it. For MVP, tokens are a vanity metric (like XP in a game). Later, you can build a token shop where users exchange tokens for cosmetics, bonus trades, or streak freezes. The important thing is users start accumulating them now, so they feel invested.

---

## Quick Reference: Claude Code Commands You'll Use

| Command | What It Does |
|---------|-------------|
| `Shift+Tab` (twice) | Enter Plan Mode (Claude analyzes but doesn't code) |
| `/init` | Generate initial CLAUDE.md (skip this — you already have one) |
| `/clear` | Clear context window (use between phases) |
| `/compact` | Compress conversation to save context space |
| `Esc` | Stop Claude mid-action |
| `claude --model opus` | Use Opus 4.6 for complex architecture work |
| `claude --model sonnet` | Use Sonnet for routine implementation (cheaper) |

---

*Built with vibes. Ship it.* 🚀
