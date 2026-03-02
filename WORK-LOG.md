# Work Log
> Last updated: 2026-03-02 (Modal code review fixes — sanitize, sell minimum, FP rounding, dead ref)

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

### v2 Features — Trade History, Portfolio Snapshots, Interactive Demo, Mobile QA
Delivered via 4 parallel agents (commit 5f36a78, 28 files changed, 1127 additions).

#### Trade History API + Dashboard
- GET `/api/trade/history` route with pagination (`?limit=20&offset=0`), auth required
- Trade history component fetches real data (ticker, type badge, shares, price, total, date)
- Dashboard already wired — no page-level changes needed

#### Portfolio Snapshots Cron + Performance Chart
- Vercel cron job at `/api/cron/snapshot` (daily midnight UTC via `vercel.json`)
- Supabase admin client at `src/lib/supabase/admin.ts` — bypasses RLS for batch operations
- GET `/api/portfolio/history` route with `?days=30` param
- Recharts LineChart performance chart with period selector (1W / 1M / 3M / ALL)
- Empty state: "No data yet — check back tomorrow!" until cron has run at least once

#### Mobile QA & Polish
- 14 touch target fixes (44px minimum on all interactive elements)
- 12 mobile responsiveness fixes at 375px (leaderboard tabs, stock detail, trade rows, search dropdown, etc.)
- 3 dark mode fixes (stock chart grid/text/borders detect light/dark mode)
- `scrollbar-hide` CSS utility added to `globals.css`
- `QA-REPORT.md` created with full audit details

#### Interactive Landing Page Demo
- `src/components/landing/interactive-demo.tsx` — client-side mini trading sim, no auth required
- Mock data for 5 stocks: AAPL, TSLA, GOOGL, AMZN, MSFT
- Flow: stock list → buy interface → animated confirmation → P&L animation → CTA to signup
- Framer Motion animations, glass-morphism styling
- Integrated between FeaturesGrid and SocialProof on landing page

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

### Code Review Fixes (commit 8f3808e, 11 files changed)
Full automated code review via code-improver agent. 14 issues found and fixed across critical, important, and suggestion categories.

**Critical fixes:**
- `src/app/api/cron/snapshot/route.ts`: CRON_SECRET bypass closed — now returns HTTP 500 if the env var is missing instead of accepting "Bearer undefined"
- `src/app/api/cron/snapshot/route.ts`: N sequential upserts replaced with a single batch upsert to prevent timeout at scale
- `src/components/portfolio/performance-chart.tsx`: Tooltip double-conversion fixed — changed `formatCurrency(value*100)` to `formatDollars(value)` (value is already dollars)

**Important fixes:**
- `src/app/api/trade/history/route.ts`: Two DB queries merged into one using `{ count: 'exact' }` option
- `src/app/api/portfolio/history/route.ts`: `?days=0` falsy bug fixed with explicit `isNaN` check instead of relying on JS truthiness
- `vercel.json`: Cron schedule moved from midnight UTC (00:00) to 22:00 UTC — runs after US market close instead of mid-session
- `src/components/landing/interactive-demo.tsx`: Confirmation setTimeout stored in `animationRef` for proper cleanup on unmount
- `src/components/portfolio/performance-chart.tsx`: Added `AbortController` + `useReducer` to prevent race conditions on rapid period switching
- `src/components/layout/bottom-nav.tsx`: Active state fixed — added trailing slash check to prevent `startsWith` false positives
- `src/components/layout/sidebar.tsx`: Same active state trailing slash fix as bottom-nav
- `src/components/market/stock-chart.tsx`: Added `res.ok` check + `AbortController` to fetch
- `src/components/market/stock-search.tsx`: Added `AbortController` + `res.ok` check to debounced fetch (prevents stale search results)

**Suggestions fixed:**
- `src/components/landing/interactive-demo.tsx`: Merged duplicate `@/lib/utils` imports
- `src/components/market/stock-chart.tsx`: Removed no-op ternary (`d.time === number ? d.time : d.time` → `d.time`)
- `src/components/portfolio/performance-chart.tsx`: Removed unnecessary `handlePeriod` wrapper function

### Deployment (post-code-review)
- Redeployed to Vercel production at https://paper-trading-app-delta.vercel.app (commit 8f3808e)

---

### Phase 9 — v2 Features Round 2 (5 parallel agents, 2026-03-02)
Delivered via 5 parallel agents (trade-history, portfolio-chart, tutorial, demo, integration).

#### Trade History Enhancements
- `src/components/trade/trade-history.tsx`: Added `limit` prop for dashboard "Recent Trades" (limit=5)
- `src/app/api/trade/history/route.ts`: Already existed and functional (no changes needed)

#### Portfolio Snapshots + Performance Chart Updates
- `supabase/migrations/003_portfolio_snapshots.sql`: Upgrade total_value_cents, cash_cents, holdings_value_cents from INTEGER to BIGINT
- `src/app/api/portfolio/history/route.ts`: Updated to accept `?period=1W|1M|3M|ALL` (backwards-compatible `?days=` fallback)
- `src/components/portfolio/performance-chart.tsx`: Updated to use `?period=` param; empty state message: "Your first snapshot will appear tomorrow"

#### Tutorial Quest System (13 new files)
- `supabase/migrations/004_tutorial_progress.sql`: tutorial_progress table with RLS
- `src/lib/game/tutorial.ts`: TUTORIAL_STEPS (5 steps), COMPLETION_BONUS (100 tokens + "Early Learner"), helpers
- `src/app/api/tutorial/complete/route.ts`: POST — validate step, mark complete, award tokens, bonus on all-5
- `src/app/api/tutorial/status/route.ts`: GET — progress, counts, tokens earned/remaining
- `src/hooks/useTutorialStep.ts`: Auto-complete hook (on mount, checks + completes step)
- 4 UI variants: tutorial-checklist (dashboard card), tutorial-walkthrough (guided overlay), tutorial-quest-log (floating panel), tutorial-banner (page-contextual)
- `src/components/tutorial/tutorial-switcher.tsx`: Renders correct variant based on localStorage `tutorial_style`
- `src/components/tutorial/tutorial-toast.tsx`: Completion toast (auto-dismiss 4s)

#### Interactive Landing Demo Rewrite
- `src/components/landing/interactive-demo.tsx`: Full rewrite — live price ticker (4 stocks, 2.5s random walk), buy/sell buttons, Market/Portfolio tabs, real-time P&L, trade notifications, CTA to signup

#### Dashboard Integration + QA
- `src/app/(dashboard)/dashboard/page.tsx`: Integrated TutorialSwitcher, TutorialToast, useTutorialStep('check_portfolio'), TradeHistory limit=5
- Tutorial hooks wired: explore (find_stock), trade detail (first_trade + meet_ai_coach), rewards (claim_reward)
- `src/app/(dashboard)/settings/page.tsx`: Tutorial Style selector (5 options, localStorage)
- `src/components/layout/header.tsx`: Clickable tokens→/rewards, avatar→/settings, CSS tooltips on all items
- 8 touch target fixes (44px minimum) across category chips, chart buttons, tutorial components
- Duplicate import cleanup in leaderboard components
- Lint fixes: settings useEffect setState warning, trade-history missing dep

#### Build Stats
- `npm run build`: 0 errors, 31 routes (10 static, 21 dynamic) — up from 27 routes
- `npm run lint`: 0 errors, 0 warnings
- `QA-REPORT.md`: Updated with v2 integration audit

---

### Stock Detail Page Fixes (commit 4b859fc, 4 files changed, 388 additions)

#### Chart Crosshair Tooltip
- `src/components/market/stock-chart.tsx`: Added `subscribeCrosshairMove` with price + timestamp overlay
- Floating overlay (top-left, pointer-events-none) shows price via `formatDollars` and time via `formatChartTime`
- `formatChartTime` helper: intraday (1D/1W) → `toLocaleTimeString`, daily+ → `toLocaleDateString`
- `rangeRef` pattern to access current range inside callback without stale closure
- Proper cleanup: `unsubscribeCrosshairMove` in useEffect return

#### Buy/Sell Modals
- `src/components/trade/buy-modal.tsx`: Enhanced with success state (shares, price, total + "View AI Analysis" link), `$` prefix input, inline validation (min $1, insufficient funds), "Max" button, `onSuccess` callback
- `src/components/trade/sell-modal.tsx`: Enhanced with success state, "Sell All" button, validation (positive shares, can't exceed owned), estimated dollar value, destructive button styling
- Both modals: `inputMode="decimal"` for mobile, input sanitization (strips non-numeric, prevents multiple dots, decimal place limits)

#### Stock Detail Page Wiring
- `src/app/(dashboard)/stock/[ticker]/page.tsx`: Replaced `<Link href="/dashboard">` buy button with modal trigger
- Added Sell button (only visible when user holds shares of that stock)
- Fetches portfolio via `usePortfolioStore` for cash balance and current holdings
- `handleTradeSuccess` callback refreshes both quote and portfolio data after trade

#### Build Stats
- `npm run build`: 0 errors, 31 routes
- `npm run lint`: 0 errors, 0 warnings
- Deployed to Vercel production (https://paper-trading-app-delta.vercel.app)

---

### Feature Sprint — v2 Features Round 3 (4 parallel agents, 2026-03-02)
Delivered via 4 parallel agents. Committed as `feat: curated watchlists, stock stats, enhanced allocation chart, leaderboard periods`. Pushed to GitHub, Vercel deploy triggered.

#### Curated Watchlists on Explore Page
- `src/lib/market/watchlists.ts`: Added `CuratedWatchlist` interface + `CURATED_WATCHLISTS` array
- `src/components/market/curated-watchlists.tsx`: Horizontal scroll sections with batched quote fetching
- `src/app/(dashboard)/explore/page.tsx`: Renders CuratedWatchlists above CategoryChips
- 3 lists: "Trending Today", "Beginner Friendly", "Tech Giants" with 6 tickers each

#### Stock Detail Key Stats
- `src/types/index.ts`: Extended `StockQuote` with 8 optional fields (marketCap, peRatio, 52-week high/low, volume, avgVolume, dividendYield, beta)
- `src/lib/market/yahoo.ts`: `getQuote()` extracts extra fields from yahoo-finance2
- `src/components/market/stock-stats.tsx`: Responsive 2x4 grid with `formatLargeNumber`/`formatVolume` helpers
- `src/app/(dashboard)/stock/[ticker]/page.tsx`: Renders StockStats below chart

#### Enhanced Allocation Chart
- `src/components/portfolio/allocation-chart.tsx`: Full rewrite as drop-in replacement
- Center donut text showing total portfolio value
- Enhanced grid legend (2 cols mobile, 3 cols desktop) with percentages
- Distinct cash color (slate-400), "Other" bucket for holdings <3% when >5 holdings
- Theme-aware chart colors via CSS variables

#### Leaderboard Period Filtering
- `src/lib/leaderboard/calculations.ts`: Added `calculatePeriodReturnPercent()` and `getPeriodSnapshotDate()`
- `src/app/api/leaderboard/route.ts`: Queries `portfolio_snapshots` for period-based returns via admin client
- Daily = 1-day lookback, Weekly = 7-day lookback, All-time = existing calculation
- Falls back to $10k starting balance when no snapshot exists

#### Build Stats
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings

---

### Stock Detail Page Improvements (2 parallel agents, 2026-03-02)
Delivered via 2 parallel agents. 3 commits pushed to GitHub, Vercel deploy triggered.

#### Full Trading Day 1D Chart
- `src/lib/market/yahoo.ts`: Added `includePrePost: true` to `getChartData` for 1D range — pre-market and after-hours data now included
- `src/components/market/stock-chart.tsx`: Added `getETOffset()` helper for EDT/EST detection (2nd Sunday March - 1st Sunday November)
- 1D chart x-axis now spans 4:00 AM ET - 8:00 PM ET via `chart.timeScale().setVisibleRange()` instead of `fitContent()`
- Non-1D ranges still use `fitContent()` as before

#### Date in Chart Tooltips + X-Axis Labels
- `src/components/market/stock-chart.tsx`: Updated `formatChartTime` — intraday now shows "Mar 2, 2:01 PM" (was just "2:01 PM"), daily+ unchanged ("Feb 15, 2026")
- Added `tickMarkFormatter` to timeScale options — 1D/1W show readable times ("10:00 AM", "12:00 PM"), daily+ uses Lightweight Charts defaults
- Fixes the issue where 1D x-axis showed repeating "2" instead of proper time labels

#### Buy/Sell Dual-Input Toggle (Dollars or Shares)
- `src/components/trade/buy-modal.tsx`: Added `mode` state ('dollars' | 'shares') with inline tab toggle
  - Dollars mode: existing behavior (dollar input, shows estimated shares)
  - Shares mode: share input (up to 6 decimals), shows estimated cost
  - Max button: dollars mode fills cash balance, shares mode computes max affordable fractional shares
  - Both modes validate min $1 and insufficient funds, call `executeBuy(ticker, amountCents)`
- `src/components/trade/sell-modal.tsx`: Added `mode` state ('shares' | 'dollars') with inline tab toggle
  - Shares mode: existing behavior (share input, shows estimated value)
  - Dollars mode: dollar input, computes shares to sell
  - Max button adapts per mode (shares owned or max dollar value)
  - Both modes call `executeSell(ticker, sharesToSell)`
- Added `cn` import to both files for toggle styling

#### Commits
1. `feat: buy/sell by shares or dollars with dual-input toggle` (e3ca1d7)
2. `fix: include extended hours data in 1D chart` (cc734c4)
3. `fix: full-day 1D chart range, date in tooltips, x-axis labels` (e84ad39)

#### Build Stats
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings
- Pushed to GitHub, Vercel deploy triggered

---

### Bidirectional Sync Rewrite — Buy/Sell Modals (commit c6517b6, 2026-03-02)
Replaced the toggle-based single-input approach (dollars OR shares) with two always-visible, bidirectionally synced fields. Continuation of the previous session that delivered curated watchlists, stock stats, allocation chart, leaderboard periods, and stock chart improvements.

#### Buy Modal (`src/components/trade/buy-modal.tsx`)
- Dollar amount field (top, primary) + shares field (bottom), always visible simultaneously
- Typing in one field auto-computes the other using current stock price
- `sanitize()` helper for input validation (strips non-numeric chars, enforces decimal limits: 2dp for dollars, 6dp for shares)
- ArrowUpDown icon as sync indicator between fields
- Max button fills dollar field with full cash balance
- Summary line: "Buying X shares for $Y"

#### Sell Modal (`src/components/trade/sell-modal.tsx`)
- Shares field (top, primary) + dollar estimate field (bottom), always visible simultaneously
- Bidirectional sync: typing shares computes dollar estimate, typing dollars computes shares needed
- `sanitize()` helper with same validation rules
- ArrowUpDown sync indicator between fields
- Sell All button fills shares field with total held shares
- Summary line: "Selling X shares for $Y"

#### Build & Deploy
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings
- Committed as c6517b6: `feat: bidirectional sync for buy/sell modals — two always-visible inputs`
- Pushed to GitHub, Vercel auto-deploy triggered

---

### Code Review Fixes (commit 72d93fc, 4 files changed, 51 insertions, 27 deletions)
Automated code review via code-improver agent on the 4 files changed in the previous session (stock-chart.tsx, yahoo.ts, buy-modal.tsx, sell-modal.tsx). 9 issues found and fixed across critical, important, and suggestion categories.

**Critical fixes:**
- `src/components/market/stock-chart.tsx`: Intraday chart times now display in ET (`timeZone: 'America/New_York'`) instead of browser local timezone — tooltips and x-axis labels consistent for all users
- `src/components/market/stock-chart.tsx`: `tickMarkFormatter` — replaced `undefined as unknown as string` unsafe cast with conditional spread that only attaches formatter for intraday ranges
- `src/components/market/stock-chart.tsx`: Replaced `setUTCHours` overflow (24+ hours in EDT) with explicit `Date.UTC` arithmetic for 1D visible range calculation

**Important fixes:**
- `src/lib/market/yahoo.ts`: 1D chart now looks back 5 days instead of 1 — fixes blank chart on weekends and holidays
- `src/components/trade/buy-modal.tsx`: Buy modal Max button in shares mode — added FP rounding guard to prevent computed cost exceeding cash balance by 1 cent
- `src/components/trade/sell-modal.tsx`: Sell modal Max button in dollars mode — `Math.floor` prevents rounding up past what shares are worth
- `src/components/market/stock-chart.tsx`: Added `active` flag to chart fetch effect to prevent stale state updates on rapid ticker/range changes

**Suggestions fixed:**
- `src/lib/market/yahoo.ts`: Deduplicate + sort chart timestamps (Yahoo can return dupes with `includePrePost`)
- `src/components/trade/buy-modal.tsx` + `sell-modal.tsx`: Added `type="button"` to all modal toggle buttons to prevent accidental form submission

#### Build Stats
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings
- Pushed to GitHub, Vercel deploy triggered

---

## In Progress
Nothing currently in progress.

---

## Up Next
- [ ] Add ANTHROPIC_API_KEY to Vercel env vars -- AI coach errors without it
- [ ] Add CRON_SECRET env var to Vercel for daily snapshot cron
- [ ] Add SUPABASE_SERVICE_ROLE_KEY env var to Vercel for cron admin client
- [ ] Configure Google OAuth in Supabase (needs Google client ID/secret)
- [ ] Connect GitHub repo to Vercel for auto-deploy on push

---

## Known Issues / Context

### Architecture
- **29 routes total**: Static (/, /login, /signup, /onboarding), Dynamic (/dashboard, /explore, /rewards, /leaderboard, /settings, /stock/[ticker], /trade/[id], /callback), API (/api/market/*, /api/trade/*, /api/trade/history, /api/portfolio, /api/portfolio/history, /api/rewards/*, /api/leaderboard, /api/cron/snapshot, /api/tutorial/complete, /api/tutorial/status)
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
- Cron job at `/api/cron/snapshot` needs CRON_SECRET and SUPABASE_SERVICE_ROLE_KEY env vars in Vercel before it will run successfully. Note: cron now fails closed (HTTP 500) if CRON_SECRET is missing — it no longer silently accepts "Bearer undefined".
- Portfolio performance chart shows empty state ("No data yet — check back tomorrow!") until the cron has run at least once and populated `portfolio_snapshots`. Cron now runs at 22:00 UTC (after US market close).
- Interactive landing page demo uses mock data only — no API calls are made.
- yahoo-finance2 occasionally returns zero prices -- the zero-price rejection in `yahoo.ts` handles this.
- ResizeObserver in stock-chart.tsx was leaking -- fixed with proper cleanup in useEffect.
- Code review fixes (commit 8f3808e) are deployed to production. All 14 identified issues resolved.
- Code review fixes (commit 72d93fc) deployed. 9 issues fixed: ET timezone for charts, weekend/holiday 1D blank chart fix, FP rounding guards in modals, stale fetch prevention, timestamp dedup, button type safety.
- Code review fixes (commit 96d2c63) deployed. 6 fixes: sanitize bare dot input, sell $1 minimum proceeds, cents-math FP rounding, formatShares in handleSellAll, removed dead activeField ref, safer handleClose ordering.

### Database
- **Supabase project**: ref `xteeugmsfirnqiphjjtg`, URL `https://xteeugmsfirnqiphjjtg.supabase.co`
- **Tables**: users, holdings, trades, daily_rewards, token_transactions, leaderboard_cache, portfolio_snapshots, tutorial_progress
- **RLS**: enabled on all tables. Users read/write own data only. leaderboard_cache is public SELECT.
- **Migrations**: `001_initial_schema.sql`, `002_architecture_additions.sql`, `003_portfolio_snapshots.sql`, `004_tutorial_progress.sql`

### Git
- **Branch**: master, build + lint clean (0 errors, 0 warnings)
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
| `src/lib/supabase/admin.ts` | created | Supabase admin client (bypasses RLS) |
| `src/components/trade/trade-history.tsx` | modified | Fetches real trade data from API |
| `QA-REPORT.md` | created | Full mobile/dark-mode QA audit |
| *(16 additional files)* | modified | Mobile responsiveness, touch targets, dark mode fixes |
| `src/app/api/cron/snapshot/route.ts` | created+modified | Daily cron; hardened: fails closed on missing CRON_SECRET, single batch upsert |
| `src/app/api/trade/history/route.ts` | created+modified | Trade history API; combined 2 DB queries into 1 with `{ count: 'exact' }` |
| `src/app/api/portfolio/history/route.ts` | created+modified | Portfolio history API; fixed `?days=0` falsy bug with explicit `isNaN` check |
| `src/components/portfolio/performance-chart.tsx` | modified | Recharts LineChart; useReducer + AbortController (race conditions); formatDollars tooltip fix |
| `src/components/market/stock-chart.tsx` | modified | ResizeObserver leak fix, TradingView logo removed; `res.ok` check + AbortController; no-op ternary removed |
| `src/components/market/stock-search.tsx` | modified | AbortController + `res.ok` check to debounced fetch (prevents stale results) |
| `src/components/layout/bottom-nav.tsx` | modified | Fixed active state false positives with trailing slash check |
| `src/components/layout/sidebar.tsx` | modified | Fixed active state false positives with trailing slash check |
| `src/components/landing/interactive-demo.tsx` | created+modified | Mini trading sim; timeout stored in animationRef for cleanup; merged duplicate imports |
| `vercel.json` | created+modified | Cron job config; schedule updated to 22:00 UTC (after US market close) |
| `src/components/market/stock-chart.tsx` | modified | Added crosshair tooltip overlay (subscribeCrosshairMove, formatChartTime) |
| `src/components/trade/buy-modal.tsx` | modified | Success state, $ prefix, inline validation, Max button, onSuccess callback |
| `src/components/trade/sell-modal.tsx` | modified | Success state, Sell All, validation, estimated value, destructive styling |
| `src/app/(dashboard)/stock/[ticker]/page.tsx` | modified | Modal triggers, sell button, portfolio fetch, handleTradeSuccess; renders StockStats |
| `src/lib/market/watchlists.ts` | created | CuratedWatchlist interface + CURATED_WATCHLISTS array (3 lists, 6 tickers each) |
| `src/components/market/curated-watchlists.tsx` | created | Horizontal scroll sections with batched quote fetching |
| `src/app/(dashboard)/explore/page.tsx` | modified | Renders CuratedWatchlists above CategoryChips |
| `src/types/index.ts` | modified | StockQuote extended with 8 optional fields (marketCap, peRatio, 52W, volume, etc.) |
| `src/lib/market/yahoo.ts` | modified | getQuote() extracts extra fields from yahoo-finance2 |
| `src/components/market/stock-stats.tsx` | created | Responsive 2x4 stats grid with formatLargeNumber/formatVolume helpers |
| `src/components/portfolio/allocation-chart.tsx` | modified | Full rewrite: donut center text, enhanced legend, "Other" bucket, theme-aware colors |
| `src/lib/leaderboard/calculations.ts` | modified | Added calculatePeriodReturnPercent() and getPeriodSnapshotDate() |
| `src/app/api/leaderboard/route.ts` | modified | Queries portfolio_snapshots for period-based returns via admin client |
| `src/lib/market/yahoo.ts` | modified | Added `includePrePost: true` for 1D range (extended hours data) |
| `src/components/market/stock-chart.tsx` | modified | `getETOffset()` EDT/EST helper, full-day 1D range, `formatChartTime` date in tooltips, `tickMarkFormatter` x-axis labels; **72d93fc**: ET timezone fix, safe tickMarkFormatter, Date.UTC range calc, active flag for stale fetch |
| `src/components/trade/buy-modal.tsx` | modified | **c6517b6**: Bidirectional sync rewrite — two always-visible fields (dollars top + shares bottom), sanitize() helper, ArrowUpDown indicator, Max button, summary line; **96d2c63**: sanitize bare dot→"0.", cents-math FP rounding, removed dead activeField ref, safer handleClose ordering |
| `src/components/trade/sell-modal.tsx` | modified | **c6517b6**: Bidirectional sync rewrite — two always-visible fields (shares top + dollars bottom), sanitize() helper, ArrowUpDown indicator, Sell All button, summary line; **96d2c63**: sanitize bare dot→"0.", $1 min proceeds check, cents-math FP rounding, formatShares in handleSellAll, removed dead activeField ref, safer handleClose ordering |
| `src/lib/market/yahoo.ts` | modified | **72d93fc**: 5-day lookback for 1D (weekend/holiday fix), deduplicate + sort chart timestamps |

---

### Modal Code Review Fixes (commit 96d2c63, 2026-03-02)
Resumed from context break. Previous session had completed the bidirectional sync rewrite for buy/sell modals but hadn't verified build/lint. This session verified, committed, ran code-improver, and applied fixes.

#### Build Verification (bidirectional sync rewrite)
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings
- Committed as c6517b6: `feat: bidirectional sync for buy/sell modals — two always-visible inputs`
- Pushed to GitHub

#### Code Review via code-improver Agent
- Ran code-improver on `buy-modal.tsx` and `sell-modal.tsx`
- 12 issues identified across both files
- 6 fixes applied:

**Bug fixes:**
- `src/components/trade/buy-modal.tsx` + `sell-modal.tsx`: `sanitize(".")` now returns `"0."` instead of passing through — prevents NaN propagation when user types a bare decimal point
- `src/components/trade/sell-modal.tsx`: Added $1.00 minimum proceeds check (`proceedsCents < 100`) — prevents dust sells that would create sub-dollar transactions

**Precision fixes:**
- `src/components/trade/buy-modal.tsx` + `sell-modal.tsx`: Shares-to-dollars sync uses `Math.round(s * price * 100) / 100` (cents math) — avoids floating-point drift in displayed dollar amounts
- `src/components/trade/sell-modal.tsx`: `handleSellAll` uses `formatShares()` instead of `.toString()` — prevents scientific notation edge case for very small share counts

**Cleanup fixes:**
- `src/components/trade/buy-modal.tsx` + `sell-modal.tsx`: Removed dead `activeField` ref and `onFocus` handlers — ref was written but never read anywhere
- `src/components/trade/buy-modal.tsx` + `sell-modal.tsx`: `handleClose` calls `onSuccess` after state reset — safer ordering prevents stale state in parent callbacks

#### Build & Deploy
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings
- Committed as 96d2c63: `fix: modal code review — sanitize bare dot, sell minimum, FP rounding, dead ref`
- Pushed to GitHub, Vercel auto-deploy triggered
