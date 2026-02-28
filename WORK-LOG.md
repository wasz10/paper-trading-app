# Work Log
> Last updated: 2026-02-27 23:30

---

## Current Session
- **Goal**: Build full paper-trading app from spec through deployment (Phases 1-8, security hardening, bug fixes, deploy)
- **Branch**: master
- **Started**: 2026-02-27

---

## Completed This Session

### Phase 1.5 — Project Scaffold & Supabase Setup
- Next.js 15 App Router project initialized with TypeScript strict mode
- Tailwind CSS 4 + shadcn/ui component library installed and configured
- Supabase project provisioned (ref: `xteeugmsfirnqiphjjtg`)
- Database migrations written and applied: `001_initial_schema.sql`, `002_architecture_additions.sql`
- RLS enabled on all tables; users read/write only their own data
- Supabase client helpers created: `src/lib/supabase/server.ts` (server), `src/lib/supabase/client.ts` (browser)
- Email confirmation disabled (mailer_autoconfirm: true)

### Phase 2 — Authentication
- Login, signup, onboarding pages under `src/app/(auth)/`
- Auth callback route at `src/app/callback/`
- Onboarding flow collects display name, experience level, interests
- Hardened onboarding: removed client-supplied financial values (cash_balance, token_balance)
- Google OAuth button present in UI but not yet configured server-side

### Phase 3 — Market Data
- yahoo-finance2 v3.13.1 wrapper at `src/lib/market/yahoo.ts`: getQuote, searchStocks, getChartData
- In-memory cache at `src/lib/market/cache.ts` with TTL (quotes 60s, charts 5m, search 10m)
- API routes: `/api/market/quote/[ticker]`, `/api/market/search`, `/api/market/chart/[ticker]`
- Zero-price rejection added to prevent bad data propagation
- Intraday timestamp fix for 1D/1W charts (unix seconds vs YYYY-MM-DD strings)

### Phase 4 — Trading Engine
- Core engine at `src/lib/trading/engine.ts`: executeBuy, executeSell
- Validation at `src/lib/trading/validation.ts`: validateBuy, validateSell, isDustPosition, calculateShares (6dp floor)
- Buy/sell API routes at `/api/trade/buy` and `/api/trade/sell`
- Trade detail route at `/api/trade/[id]`
- Optimistic locking on cash_balance to prevent double-spend race conditions
- Holding error rollback on failed balance updates
- Ticker regex validation (`^[A-Z0-9.\-]{1,10}$`) in buy/sell routes

### Phase 5 — Rewards & Gamification
- Daily reward system at `src/lib/game/rewards.ts` (tier: Day 1=10, 2=15, 3-6=20, 7=50 tokens, cycles)
- Streak calculator at `src/lib/game/streaks.ts`
- Weekly challenges at `src/lib/game/challenges.ts` (3 challenges with check functions)
- Rewards API: `/api/rewards/claim`, `/api/rewards/status`
- Rewards UI components under `src/components/rewards/`
- Rewards page at `/rewards`

### Phase 6 — AI Coach
- Trade analysis at `src/lib/ai/analysis.ts` using Claude claude-sonnet-4-5-20250929, max 200 tokens
- Dynamic prompts at `src/lib/ai/prompts.ts` (celebratory/encouraging/educational tone)
- Analysis API at `/api/trade/[id]/analysis`
- AI coach UI components under `src/components/ai/`
- NOTE: Currently errors because ANTHROPIC_API_KEY is not in Vercel env vars

### Phase 7 — Leaderboard
- Leaderboard calculations at `src/lib/leaderboard/calculations.ts`
- Return % formula: `((portfolioValue - 1000000) / 1000000) * 100`
- Batch price fetching for all unique tickers across users
- Leaderboard API at `/api/leaderboard`
- UI components: table, row, user-rank-card under `src/components/leaderboard/`
- Leaderboard page at `/leaderboard` with period tabs
- `leaderboard_cache` table with public SELECT RLS

### Phase 8 — Landing Page & Settings
- Full landing page rewrite at `src/app/page.tsx`
- Landing components: hero, features, social-proof, CTA under `src/components/landing/`
- Settings page at `src/app/(dashboard)/settings/page.tsx` (display name, timezone, preferences)

### Security Fixes
- Optimistic locking on balance updates in trading engine (prevent double-spend)
- Ticker regex validation in buy/sell API routes
- Onboarding hardened: server ignores client-supplied cash_balance / token_balance
- Zustand stores (`portfolio-store.ts`, `trade-store.ts`) now check `res.ok` before parsing

### Bug Fixes
- 1D/1W chart timestamps: intraday uses unix seconds (number), daily+ uses YYYY-MM-DD (string)
- `ChartDataPoint.time` type updated to `string | number` in `src/types/index.ts`
- ResizeObserver leak fix in `stock-chart.tsx`
- TradingView watermark/logo removed from chart component
- Time type cast fix in chart component

### Deployment
- Deployed to Vercel at https://paper-trading-app-delta.vercel.app
- Supabase migrations applied to production
- Vercel env vars set: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Build + lint clean: 0 errors, 0 warnings
- User tested: signup, onboarding, explore stocks -- all working

---

## In Progress
Nothing currently in progress.

---

## Up Next
- [ ] Add ANTHROPIC_API_KEY to Vercel env vars -- AI coach errors without it
- [ ] Configure Google OAuth in Supabase (needs Google client ID/secret)
- [ ] Trade history on dashboard -- placeholder now, needs API endpoint returning user's trades
- [ ] Portfolio performance chart -- needs daily cron job to populate `portfolio_snapshots` table
- [ ] Phase 8B: Interactive demo on landing page (client-side mini trading sim, no auth)
- [ ] Phase 8D: QA swarm -- mobile responsiveness, dark mode, edge cases, performance
- [ ] Connect GitHub repo to Vercel for auto-deploy on push

---

## Known Issues / Context

### Architecture
- **24 routes total**: Static (/, /login, /signup, /onboarding), Dynamic (/dashboard, /explore, /rewards, /leaderboard, /settings, /stock/[ticker], /trade/[id], /callback), API (/api/market/*, /api/trade/*, /api/portfolio, /api/rewards/*, /api/leaderboard)
- **Layout**: Desktop = left sidebar (w-64) + header + main. Mobile = bottom nav (h-16) + header + full-width. Both share 5 nav items: Dashboard, Explore, Rewards, Leaderboard, Settings.
- **Dashboard layout**: `src/app/(dashboard)/layout.tsx` is a server component that does auth check + profile fetch.
- **State management**: Zustand stores for portfolio and trade state; server components fetch directly from Supabase.

### Critical Conventions
- **All money = integer cents**. $10,000.00 = 1000000. Use `formatCurrency(cents)` for display.
- **Shares = 6 decimal places**. `calculateShares` uses `Math.floor(x * 1e6) / 1e6`.
- **Trading engine uses optimistic locking**: `.eq('cash_balance', previousBalance)` on update to prevent double-spend.
- **Ticker validation**: `^[A-Z0-9.\-]{1,10}$` regex in buy/sell routes.
- **Chart timestamps**: unix seconds (number) for 1D/1W intraday, YYYY-MM-DD (string) for daily+. `ChartDataPoint.time` is `string | number`.
- **yahoo-finance2 v3**: requires `new YahooFinance()` instantiation and `serverExternalPackages: ['yahoo-finance2']` in `next.config.ts`.
- **Supabase clients**: server = `createClient()` from `@/lib/supabase/server`, browser = `createClient()` from `@/lib/supabase/client`.
- **Leaderboard return %**: `((portfolioValue - 1000000) / 1000000) * 100`.

### Technical Gotchas
- AI coach will 500 error until ANTHROPIC_API_KEY is added to Vercel env vars.
- Google OAuth button is rendered but has no server-side config -- clicking it will fail.
- Trade history component on dashboard always shows empty state (no trades API for listing user trades).
- Portfolio performance chart placeholder exists but `portfolio_snapshots` table has no cron job populating it yet.
- yahoo-finance2 occasionally returns zero prices -- the zero-price rejection in `yahoo.ts` handles this.
- ResizeObserver in stock-chart.tsx was leaking -- fixed with proper cleanup in useEffect.

### Database
- **Supabase project**: ref `xteeugmsfirnqiphjjtg`, URL `https://xteeugmsfirnqiphjjtg.supabase.co`
- **Tables**: users, holdings, trades, daily_rewards, token_transactions, leaderboard_cache, portfolio_snapshots
- **RLS**: enabled on all tables. Users read/write own data only. leaderboard_cache is public SELECT.
- **Migrations**: `supabase/migrations/001_initial_schema.sql`, `002_architecture_additions.sql`

### Git
- **Branch**: master, 6 commits, build + lint clean
- **GitHub**: https://github.com/wasz10/paper-trading-app

### Workflow
- Custom agents available: **code-improver** (after significant code), **code-cleanup** (periodically), **work-logger** (session save/handoff)
- Use **agent teams** (TeamCreate) for parallel work on non-overlapping files
- Task progress tracked in this file (`WORK-LOG.md`)

---

## Key Files This Session

| File | Status | Notes |
|------|--------|-------|
| `src/lib/trading/engine.ts` | modified | Added optimistic locking, holding error rollback |
| `src/lib/market/yahoo.ts` | modified | Zero-price rejection, intraday timestamp fix |
| `src/components/market/stock-chart.tsx` | modified | ResizeObserver leak fix, TradingView logo removed, Time type cast |
| `src/types/index.ts` | modified | ChartDataPoint.time now `string\|number` |
| `src/app/api/leaderboard/route.ts` | created | Leaderboard API with batch price fetching |
| `src/lib/leaderboard/calculations.ts` | created | Return %, portfolio value, display name logic |
| `src/components/leaderboard/*.tsx` | created | Table, row, user-rank-card |
| `src/app/(dashboard)/leaderboard/page.tsx` | modified | Full leaderboard page with period tabs |
| `src/components/landing/*.tsx` | created | Hero, features, social-proof, CTA sections |
| `src/app/page.tsx` | modified | Full landing page rewrite |
| `src/app/(dashboard)/settings/page.tsx` | modified | Full settings page |
| `src/app/api/trade/buy/route.ts` | modified | Ticker regex validation |
| `src/app/api/trade/sell/route.ts` | modified | Ticker regex validation |
| `src/components/auth/onboarding-flow.tsx` | modified | Removed client-supplied financial values |
| `src/stores/portfolio-store.ts` | modified | Added `res.ok` check |
| `src/stores/trade-store.ts` | modified | Added `res.ok` check |
