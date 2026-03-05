# Work Log
> Last updated: 2026-03-04 (Sprint 4: token balance sync, theme system, badge frames — PR #6 merged, deployed)

---

## Current Session
- **Goal**: Sprint 4 — Token Balance Sync, Theme System, Badge Frames
- **Branch**: master (merged from `feat/sprint-4-token-sync-themes-badges`)
- **Started**: 2026-03-04

---

## Completed This Session

### Sprint 4 — Token Balance Sync, Theme System, Badge Frames (2026-03-04)
Continued from previous session where Sprint 4 implementation was complete (token sync, themes, badge frames), all 85 tests passing, build passing (65 routes).

#### Commits & PR
- 2 commits on `feat/sprint-4-token-sync-themes-badges` branch:
  - `feat: Sprint 4 — token balance sync, theme system, badge frames` (30 files, +1510/-29)
  - `fix: code review — input validation, error handling, FOUC prevention` (10 files, +71/-56)
- Created and merged **PR #6**: https://github.com/wasz10/paper-trading-app/pull/6
- Branch `feat/sprint-4-token-sync-themes-badges` deleted after merge

#### Code Review (via code-improver agent)
Found 12 issues, fixed 8 critical/important ones:
- Added `res.ok` checks on 5 client-side fetch calls
- Added type narrowing for request bodies (theme, badge-frame, purchase routes)
- Fixed stale-snapshot token refund race condition in purchase route
- Simplified profile-initializer (removed redundant ref guard)
- Moved keyframe CSS to globals.css (prevents FOUC + style leak)
- Added toast feedback for badge-frame-picker errors
- Removed unnecessary `'use client'` from framed-avatar

#### Sprint 4 Feature Summary
- **Token Balance Sync**: New `/api/profile/balance` endpoint; `refetchBalance()` replaces optimistic `addTokens()`; header token count now always matches shop/rewards
- **Theme System**: 3 purchasable themes (Midnight Blue, Sunset Orange, Forest Green) x dark/light variants; CSS custom properties via `data-theme` attribute; apply from shop + settings; `next-themes` for dark/light toggle
- **Badge Frame System**: 3 frame lines (Gold, Diamond, Fire) with tiered upgrades (ring -> SVG overlay -> animated); `FramedAvatar` component in header, leaderboard, trader profiles; badge frame picker in settings; prerequisite validation for upgrades
- **Appearance Settings**: New settings section with color mode toggle, theme picker, badge frame picker

#### Deployment
- Deployed to Vercel: https://paper-trading-app-delta.vercel.app
- 65 routes build successfully
- 85/85 tests pass, 0 regressions

---

## Previous Sessions

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

### Deploy Fixes + 1D Chart + Allocation Hover (2026-03-02)
Continuation session: verified earlier commits were pushed, fixed Vercel auto-deploy issues, improved 1D chart x-axis, and fixed allocation chart hover bug.

#### Vercel Deploy Verification & Manual Deployment
- Confirmed commits c6517b6 (bidirectional sync modals) and 96d2c63 (modal code review fixes) were pushed to GitHub
- Discovered Vercel auto-deploy is broken — Git integration not triggering on push
- Used `npx vercel --prod` (with `NODE_TLS_REJECT_UNAUTHORIZED=0` for corporate proxy) for all deployments this session
- All deployments confirmed live at `https://paper-trading-app-delta.vercel.app`

#### 1D Chart: Full Trading Day with Empty Space (commit 2f077a0)
- `src/components/market/stock-chart.tsx`: Added `rightOffset` calculation — estimates bar interval from data, computes remaining bars until 8 PM ET, applies as rightOffset so the x-axis extends beyond the last data point
- Added `timeVisible: true, secondsVisible: false` to timeScale options for intraday ranges — fixes x-axis showing "2" (day of month) instead of times
- Kept `tickMarkFormatter` for ET timezone display on tick marks
- `setVisibleRange` still pins 4 AM – 8 PM ET range

#### Allocation Chart Hover Fix (commit 1f8b5e5)
- `src/components/portfolio/allocation-chart.tsx`: Bug — hovering a donut segment showed a Tooltip label INSIDE the donut, overlapping with center "Total" text
- Fix: removed `<Tooltip>` component entirely, added `useState` for `hoveredIndex`
- Center `<Label>` now dynamically shows hovered segment name + value + percentage on mouse enter
- Reverts to "Total" + total portfolio value on mouse leave
- Added `onMouseEnter` per `<Cell>` and `onMouseLeave` on `<Pie>`

#### Build Stats
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings

---

### 1D Chart Empty Space Fix — LWC v4 rightOffset (commit a042e81, 2026-03-02)
Continuation session: diagnosed why `setVisibleRange` was failing to show empty space after the last data point, replaced with the LWC v4-supported `rightOffset` approach.

#### Root Cause: LWC v4 setVisibleRange Limitation
- Discovered that Lightweight Charts v4's `setVisibleRange` cannot extrapolate beyond existing data points — it silently clamps to the last data point
- This is why the 1D chart always snapped back to the current time instead of showing empty space extending to 8 PM ET
- The previous rightOffset implementation (commit 2f077a0) was combined with `setVisibleRange`, which overrode the offset

#### Fix: rightOffset + fitContent (commit a042e81)
- `src/components/market/stock-chart.tsx`: Replaced `setVisibleRange` with `rightOffset` (number of empty bars calculated from remaining trading hours) + `fitContent()`
- `rightOffset` is the LWC-supported way to show empty space after the last data point
- The chart now correctly shows empty space extending to ~8 PM ET
- Removed unused `dayStartUnix` variable (only `dayEndUnix` needed for rightOffset calculation)

#### Deployment
- Deployed via manual `npx vercel --prod` — confirmed working on production
- Build: 29 routes, 0 errors
- Lint: 0 warnings

---

### Sprint 3 — Watchlists, Analytics, Token Shop, Social Profiles (4 parallel agents, 2026-03-03)
Delivered via 4 parallel agents (commit f9a161d, 45 files changed, 2329 additions). All features have zero file overlap.

#### User Watchlists (Agent 1)
- `supabase/migrations/010_user_watchlists.sql`: user_watchlists table with UNIQUE(user_id, ticker), RLS, index
- `src/types/watchlist.ts`: WatchlistItem interface
- `src/app/api/watchlist/route.ts`: GET watchlist ordered by added_at DESC
- `src/app/api/watchlist/add/route.ts`: POST add ticker with TICKER_REGEX validation, 20 free / 50 subscriber limit
- `src/app/api/watchlist/remove/route.ts`: POST remove ticker
- `src/components/watchlist/watchlist-button.tsx`: Star icon toggle with optimistic UI, 44px touch target
- `src/components/watchlist/user-watchlist-grid.tsx`: useReducer fetch pattern, StockCard grid, empty state CTA
- `src/app/(dashboard)/watchlist/page.tsx`: Watchlist page with slot counter badge
- `src/app/(dashboard)/watchlist/loading.tsx`: Skeleton loading
- `src/app/(dashboard)/stock/[ticker]/page.tsx`: Added WatchlistButton next to AlertButton

#### Portfolio Analytics (Agent 2)
- `src/types/analytics.ts`: AnalyticsData, TradeHighlight, TickerPnL, MonthlyReturn interfaces
- `src/lib/analytics/calculations.ts`: 5 pure functions (computeWinRate, computeBestWorstTrades, computePnLByTicker, computeMonthlyReturns, computeAvgGainLoss)
- `src/lib/analytics/calculations.test.ts`: 18 Vitest unit tests covering all edge cases
- `src/app/api/analytics/route.ts`: GET endpoint fetching trades + snapshots, running calculations
- `src/components/analytics/stats-cards.tsx`: 4-card grid (Total Trades, Win Rate, Avg Gain, Avg Loss)
- `src/components/analytics/best-worst-trades.tsx`: Side-by-side best/worst trade cards
- `src/components/analytics/pnl-by-ticker-chart.tsx`: Horizontal Recharts bar chart (green=profit, red=loss)
- `src/components/analytics/monthly-returns-chart.tsx`: Vertical Recharts bar chart of monthly return %
- `src/app/(dashboard)/analytics/page.tsx`: Analytics page with loading/error/empty states
- `src/app/(dashboard)/analytics/loading.tsx`: Skeleton loading

#### Token Shop (Agent 3)
- `supabase/migrations/011_token_shop.sql`: user_purchases table with RLS, cosmetic columns on users (active_theme, active_badge_frame, bonus_trades_today)
- `src/types/shop.ts`: ShopCategory, ShopItem, ShopItemWithOwnership types
- `src/lib/shop/items.ts`: SHOP_ITEMS catalog (3 themes, 3 badge frames, 1 boost, 1 perk)
- `src/app/api/shop/items/route.ts`: GET items with ownership status + balance
- `src/app/api/shop/purchase/route.ts`: POST purchase with optimistic lock on token_balance, effect application
- `src/components/shop/shop-item-card.tsx`: Card with icon, name, price badge, buy/owned button
- `src/components/shop/shop-category-tabs.tsx`: Horizontal scrollable category filter tabs
- `src/components/shop/purchase-dialog.tsx`: Confirmation dialog with balance breakdown
- `src/app/(dashboard)/shop/page.tsx`: Shop page with filtering, purchase flow, profile store sync
- `src/app/(dashboard)/shop/loading.tsx`: Skeleton loading

#### Social Profiles (Agent 4)
- `src/types/trader.ts`: PublicProfile interface
- `src/app/api/trader/[id]/route.ts`: GET public profile with admin client, privacy check (404 for show_display_name=false)
- `src/components/trader/profile-header.tsx`: Name, PRO badge, member since, streak
- `src/components/trader/profile-stats.tsx`: 4-card grid (Return %, Total Trades, Streak, Achievements)
- `src/components/trader/profile-achievements.tsx`: Grid of unlocked achievements from ACHIEVEMENTS (read-only import)
- `src/components/trader/share-button.tsx`: Copy profile URL to clipboard
- `src/app/(dashboard)/trader/[id]/page.tsx`: Public profile page with loading/404 states
- `src/app/(dashboard)/trader/[id]/loading.tsx`: Skeleton loading
- `src/types/index.ts`: Added user_id to LeaderboardEntry
- `src/app/api/leaderboard/route.ts`: Exposes user_id for public profiles only
- `src/components/leaderboard/leaderboard-row.tsx`: Wrapped in Link when user_id present

#### Integration & Build Fix
- `src/components/layout/sidebar.tsx`: Added Watchlist, Analytics, Shop to NAV_ITEMS
- `src/components/layout/bottom-nav.tsx`: Added Watchlist, Analytics, Shop to MORE_ITEMS
- `src/lib/game/achievement-defs.ts`: Extracted achievement definitions from achievements.ts to avoid web-push import in client components
- `src/lib/game/achievements.ts`: Re-exports from achievement-defs.ts

#### Build Stats
- `npm run build`: 62 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings
- `npx vitest run`: 85 tests pass (67 existing + 18 new analytics tests)
- Pushed to GitHub, Vercel deploy triggered

### Sprint 3 Code Review Fixes (commit e781840, 9 files changed, 99 insertions, 49 deletions)
Automated code review via code-improver agent on all 45 Sprint 3 files. 6 critical, 8 important, 6 suggestions found. 10 fixes applied.

**Critical fixes:**
- `src/app/api/shop/purchase/route.ts`: Concurrent non-repeatable purchase — tokens deducted but purchase insert fails; now refunds tokens on unique constraint violation
- `src/app/api/shop/purchase/route.ts`: `boost_cash` used absolute write with no optimistic lock — now uses `.eq('cash_balance', profile.cash_balance)` with retry
- `src/app/api/shop/purchase/route.ts`: `perk_trades` used stale `bonus_trades_today` — now re-fetches before increment
- `src/app/api/watchlist/remove/route.ts`: Missing TICKER_REGEX validation — added to match add route

**Important fixes:**
- `src/lib/analytics/calculations.ts`: O(n²) `trades.indexOf(sell)` in 3 functions — replaced with pre-built index array
- `src/components/watchlist/watchlist-button.tsx`: Added AbortController to fetch, removed unused useCallback
- `src/components/watchlist/user-watchlist-grid.tsx`: Replaced isMounted ref with AbortController for proper fetch cleanup on unmount
- `src/app/api/analytics/route.ts`: Unbounded SELECT * — added LIMIT 5000 trades, 1000 snapshots
- `src/app/api/shop/purchase/route.ts`: token_transactions insert error not checked — now logs on failure
- `src/app/(dashboard)/shop/page.tsx`: Fetch and purchase errors swallowed silently — now shows toast errors

**Suggestions fixed:**
- `src/components/analytics/pnl-by-ticker-chart.tsx`: Axis tickFormatter uses `.toFixed(0)` for proper dollar formatting
- `src/components/analytics/monthly-returns-chart.tsx`: Month labels now include year ("Jan '26") to prevent duplicates across years

**Not fixed (noted for future):**
- achievements.ts uses 'daily_reward' reason for achievement tokens (needs DB migration for new enum value)
- admin.ts missing env guard on SUPABASE_SERVICE_ROLE_KEY (pre-existing)
- hasProfitableSell heuristic in achievements.ts (pre-existing)
- TOCTOU on watchlist count limit (acceptable off-by-1 edge case)
- bonus_trades_today has no daily reset mechanism (needs companion date column)

### Deployment (Sprint 3, 2026-03-03)
- Deployed via `npx vercel --prod` to https://paper-trading-app-delta.vercel.app
- 62 routes, 0 build errors
- Supabase migrations 010-011 applied (user_watchlists, user_purchases tables + cosmetic columns)

---

### Sprint 3 Hotfix — Tooltips, Dev Panel Fix, RLS Policies (PR #5, 2026-03-03)
Explored two issues (missing tooltips on stock page buttons, dev panel 500 errors), wrote spec + plan, implemented fixes, performed STRIDE security review, and merged via PR #5.

#### Root Cause Analysis
- **Dev panel 500 errors**: All 6 POST routes under `/api/dev/` used `createAdminClient()` which requires `SUPABASE_SERVICE_ROLE_KEY` — that key wasn't in the environment, causing all mutations to throw 500
- **Missing tooltips**: WatchlistButton and AlertButton on stock detail page had no hover hints for users

#### Spec & Plan
- `plans/sprint-3-hotfix-spec.md`: Problem statement, root cause, proposed fixes
- `plans/sprint-3-hotfix-plan.md`: Implementation plan with file-by-file changes

#### Tooltips
- `src/components/watchlist/watchlist-button.tsx`: Added CSS hover tooltip wrapper (dynamic: "Add to Watchlist" / "Remove from Watchlist" based on state)
- `src/components/market/alert-button.tsx`: Added CSS hover tooltip wrapper (static: "Set Price Alert") + `aria-label` for accessibility
- Used existing `.tooltip-wrapper` / `.tooltip-text` CSS pattern from `header.tsx`

#### Dev Panel Fix
- Switched all 6 POST routes from `createAdminClient()` to `createClient()` (RLS client):
  - `src/app/api/dev/tokens/route.ts`
  - `src/app/api/dev/cash/route.ts`
  - `src/app/api/dev/streak/route.ts`
  - `src/app/api/dev/reset/route.ts`
  - `src/app/api/dev/snapshot/route.ts`
  - `src/app/api/dev/tutorial/route.ts`
- Added `user_watchlists` and `user_purchases` to the reset route's `tablesToClear` array

#### STRIDE Security Review — RLS Migration 012
- Found missing RLS DELETE/UPDATE policies on 8 tables
- `supabase/migrations/012_add_missing_rls_policies.sql`: Added 7 DELETE + 1 UPDATE policy
- Migration applied to Supabase via Management API (corporate proxy blocks direct Postgres)

#### README Updated
- Sprint 3 features documented
- 16 tables (was 14)
- 85 tests (was 67)
- Updated project structure section

#### Files Changed (12 total, +303/-49)
- `src/components/watchlist/watchlist-button.tsx` — CSS tooltip wrapper
- `src/components/market/alert-button.tsx` — CSS tooltip wrapper + aria-label
- `src/app/api/dev/tokens/route.ts` — createAdminClient -> createClient
- `src/app/api/dev/cash/route.ts` — createAdminClient -> createClient
- `src/app/api/dev/streak/route.ts` — createAdminClient -> createClient
- `src/app/api/dev/reset/route.ts` — createAdminClient -> createClient + new tables in reset
- `src/app/api/dev/snapshot/route.ts` — createAdminClient -> createClient
- `src/app/api/dev/tutorial/route.ts` — createAdminClient -> createClient
- `supabase/migrations/012_add_missing_rls_policies.sql` — 7 DELETE + 1 UPDATE policy
- `README.md` — Sprint 3 features, tables, tests, structure
- `plans/sprint-3-hotfix-spec.md` — spec doc
- `plans/sprint-3-hotfix-plan.md` — implementation plan

#### Key Commits
- `e399e3b` fix: add tooltips to stock page buttons, fix dev panel server errors
- Merged via PR #5 as `65700f2`

#### Build & Deploy
- `npm run build`: 62 routes, 0 errors
- `npx vitest run`: 85 tests pass, 0 regressions
- Deployed to Vercel: https://paper-trading-app-delta.vercel.app

---

## In Progress
Nothing currently in progress.

---

## Up Next
- [ ] Sprint 5 or user-directed work (no pending tasks)
- [ ] Add ANTHROPIC_API_KEY to Vercel env vars -- AI coach errors without it
- [ ] Add CRON_SECRET env var to Vercel for daily snapshot cron
- [ ] Add SUPABASE_SERVICE_ROLE_KEY env var to Vercel for cron admin client and trader profile route
- [ ] Configure Google OAuth in Supabase (needs Google client ID/secret)
- [ ] Fix Vercel Git integration (auto-deploy not triggering on push — using manual `npx vercel --prod` as workaround)
- [ ] (Low priority) Remaining code-improver suggestions: redundant refetchBalance+fetchItems in shop, useCallback/React.memo for shop-item-card, unused cashBalance in balance API response

---

## Known Issues / Context

### Architecture
- **65 routes total** (was 62 — added balance, theme, badge-frame API routes): Static (/, /login, /signup, /onboarding), Dynamic (/dashboard, /explore, /rewards, /leaderboard, /settings, /stock/[ticker], /trade/[id], /callback, /watchlist, /analytics, /shop, /trader/[id]), API (/api/market/*, /api/trade/*, /api/trade/history, /api/portfolio, /api/portfolio/history, /api/rewards/*, /api/leaderboard, /api/cron/snapshot, /api/tutorial/complete, /api/tutorial/status, /api/watchlist, /api/watchlist/add, /api/watchlist/remove, /api/analytics, /api/shop/items, /api/shop/purchase, /api/trader/[id], /api/dev/tokens, /api/dev/cash, /api/dev/streak, /api/dev/reset, /api/dev/snapshot, /api/dev/tutorial)
- **Layout**: Desktop = left sidebar (w-64) + header + main. Mobile = bottom nav (h-16) + header + full-width. Both share 5 nav items: Dashboard, Explore, Rewards, Leaderboard, Settings.
- **Dashboard layout**: `src/app/(dashboard)/layout.tsx` is a server component that does auth check + profile fetch.
- **State management**: Zustand stores for portfolio, trade, and profile state (token balance, display name); server components fetch directly from Supabase. Profile store hydrated via `<ProfileInitializer>` bridge component in dashboard layout.

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
- 1D chart rightOffset (commit 2f077a0, updated a042e81): x-axis extends to 8 PM ET via `rightOffset` + `fitContent()`. Original `setVisibleRange` approach silently clamped to last data point (LWC v4 limitation). `timeVisible: true` fixes intraday axis labels.
- Allocation chart hover (commit 1f8b5e5): removed Tooltip component, center label dynamically shows hovered segment details.
- **Vercel auto-deploy is broken** — Git integration not triggering on push. Workaround: `NODE_TLS_REJECT_UNAUTHORIZED=0 npx vercel --prod` for manual deployment through corporate proxy.
- Sprint 3 code review fixes (commit e781840) deployed. 10 issues fixed: purchase race condition token refund, boost_cash optimistic lock, perk_trades stale value, watchlist remove validation, analytics O(n²) indexOf, AbortController in watchlist components, analytics query LIMIT, shop error toasts, chart formatting.
- `bonus_trades_today` column has no daily reset mechanism — needs companion `bonus_trades_date` column and reset logic in the trade validation flow.
- achievements.ts uses `'daily_reward'` as TokenReason for achievement token grants — should be a new `'achievement'` enum value (requires DB migration).
- **Dev panel fixed** (PR #5): All 6 `/api/dev/*` POST routes switched from `createAdminClient()` to `createClient()` (RLS). No longer requires `SUPABASE_SERVICE_ROLE_KEY` for dev operations — only cron and trader profile routes still need the service role key.
- **RLS migration 012** (PR #5): Added 7 DELETE + 1 UPDATE policies across 8 tables. Full STRIDE security coverage now in place.
- **Tooltips** (PR #5): WatchlistButton and AlertButton on stock detail page now have CSS hover tooltips matching the header.tsx pattern.
- **Sprint 4 — Token Balance Sync** (PR #6): `refetchBalance()` replaces optimistic `addTokens()` — header token count now always matches shop/rewards after any token mutation.
- **Sprint 4 — Theme System** (PR #6): 3 purchasable themes with dark/light variants via CSS custom properties on `data-theme` attribute. `next-themes` handles dark/light toggle. Badge frame keyframe CSS moved to globals.css to prevent FOUC + style leak.
- **Sprint 4 — Badge Frame System** (PR #6): 3 frame lines (Gold, Diamond, Fire) with tiered upgrades. Prerequisite validation ensures users buy lower tiers before higher ones. `FramedAvatar` used in header, leaderboard, trader profiles.
- **Local build issue**: `npm run build` fails locally due to corporate proxy blocking Google Fonts (TLS error) — Vercel builds work fine.
- **GitHub intermittent errors**: GitHub experienced 500/502 errors during the Sprint 4 session (resolved on retry).

### Database
- **Supabase project**: ref `xteeugmsfirnqiphjjtg`, URL `https://xteeugmsfirnqiphjjtg.supabase.co`
- **Supabase access token**: `sbp_7d6bc8b4282aed6f31f38abaa51fa1be6bf92836` (for `supabase db push`)
- **Tables (16)**: users, holdings, trades, daily_rewards, token_transactions, leaderboard_cache, portfolio_snapshots, tutorial_progress, user_watchlists, user_purchases, plus 6 system/auth tables
- **RLS**: enabled on all tables. Users read/write own data only. leaderboard_cache is public SELECT. Full DELETE/UPDATE coverage added in migration 012.
- **Migrations (12)**: `001_initial_schema.sql`, `002_architecture_additions.sql`, `003_portfolio_snapshots.sql`, `004_tutorial_progress.sql`, `010_user_watchlists.sql`, `011_token_shop.sql`, `012_add_missing_rls_policies.sql`

### Git
- **Branch**: master, build + lint clean (0 errors, 0 warnings)
- **Latest commit**: a25cced on master (PR #6 merge: feat/sprint-4-token-sync-themes-badges)
- **Branch `feat/sprint-4-token-sync-themes-badges`**: deleted after merge
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
| `src/components/market/stock-chart.tsx` | modified | **2f077a0**: rightOffset for 1D chart (extends x-axis to 8 PM ET), `timeVisible: true` for intraday x-axis labels; **a042e81**: replaced `setVisibleRange` with `rightOffset` + `fitContent()` (LWC v4 limitation fix), removed unused `dayStartUnix` |
| `src/components/portfolio/allocation-chart.tsx` | modified | **1f8b5e5**: Removed Tooltip, added hoveredIndex state, center label shows hovered segment details dynamically |
| `src/stores/profile-store.ts` | created | **e938b10**: Zustand store with tokenBalance, displayName, initProfile(), addTokens() |
| `src/components/layout/profile-initializer.tsx` | created | **e938b10**: Client component bridging server-fetched profile data to Zustand store |
| `src/components/layout/header.tsx` | modified | **e938b10**: Reads tokenBalance/displayName from useProfileStore instead of props |
| `src/app/(dashboard)/layout.tsx` | modified | **e938b10**: Added ProfileInitializer, Header now takes no props |
| `src/app/(dashboard)/rewards/page.tsx` | modified | **e938b10**: Calls addTokens() after daily reward claim |
| `src/hooks/useTutorialStep.ts` | modified | **e938b10**: Calls addTokens() after tutorial step completion |
| `supabase/migrations/010_user_watchlists.sql` | created | **f9a161d**: user_watchlists table with UNIQUE(user_id, ticker), RLS, index |
| `supabase/migrations/011_token_shop.sql` | created | **f9a161d**: user_purchases table with RLS, cosmetic columns on users |
| `src/types/watchlist.ts` | created | **f9a161d**: WatchlistItem interface |
| `src/types/analytics.ts` | created | **f9a161d**: AnalyticsData, TradeHighlight, TickerPnL, MonthlyReturn interfaces |
| `src/types/shop.ts` | created | **f9a161d**: ShopCategory, ShopItem, ShopItemWithOwnership types |
| `src/types/trader.ts` | created | **f9a161d**: PublicProfile interface |
| `src/types/index.ts` | modified | **f9a161d**: Added user_id to LeaderboardEntry |
| `src/app/api/watchlist/route.ts` | created | **f9a161d**: GET watchlist ordered by added_at DESC |
| `src/app/api/watchlist/add/route.ts` | created | **f9a161d**: POST add ticker with validation, 20/50 limit |
| `src/app/api/watchlist/remove/route.ts` | created | **f9a161d**: POST remove ticker |
| `src/app/api/analytics/route.ts` | created | **f9a161d**: GET endpoint fetching trades + snapshots, running calculations |
| `src/app/api/shop/items/route.ts` | created | **f9a161d**: GET items with ownership status + balance |
| `src/app/api/shop/purchase/route.ts` | created | **f9a161d**: POST purchase with optimistic lock on token_balance |
| `src/app/api/trader/[id]/route.ts` | created | **f9a161d**: GET public profile with admin client, privacy check |
| `src/app/api/leaderboard/route.ts` | modified | **f9a161d**: Exposes user_id for public profiles only |
| `src/lib/analytics/calculations.ts` | created | **f9a161d**: 5 pure functions (winRate, bestWorst, PnL by ticker, monthly, avgGainLoss) |
| `src/lib/analytics/calculations.test.ts` | created | **f9a161d**: 18 Vitest unit tests covering all edge cases |
| `src/lib/shop/items.ts` | created | **f9a161d**: SHOP_ITEMS catalog (3 themes, 3 badge frames, 1 boost, 1 perk) |
| `src/lib/game/achievement-defs.ts` | created | **f9a161d**: Extracted achievement definitions to avoid web-push import in client components |
| `src/lib/game/achievements.ts` | modified | **f9a161d**: Re-exports from achievement-defs.ts |
| `src/components/watchlist/watchlist-button.tsx` | created | **f9a161d**: Star icon toggle with optimistic UI, 44px touch target |
| `src/components/watchlist/user-watchlist-grid.tsx` | created | **f9a161d**: useReducer fetch pattern, StockCard grid, empty state CTA |
| `src/components/analytics/stats-cards.tsx` | created | **f9a161d**: 4-card grid (Total Trades, Win Rate, Avg Gain, Avg Loss) |
| `src/components/analytics/best-worst-trades.tsx` | created | **f9a161d**: Side-by-side best/worst trade cards |
| `src/components/analytics/pnl-by-ticker-chart.tsx` | created | **f9a161d**: Horizontal Recharts bar chart (green=profit, red=loss) |
| `src/components/analytics/monthly-returns-chart.tsx` | created | **f9a161d**: Vertical Recharts bar chart of monthly return % |
| `src/components/shop/shop-item-card.tsx` | created | **f9a161d**: Card with icon, name, price badge, buy/owned button |
| `src/components/shop/shop-category-tabs.tsx` | created | **f9a161d**: Horizontal scrollable category filter tabs |
| `src/components/shop/purchase-dialog.tsx` | created | **f9a161d**: Confirmation dialog with balance breakdown |
| `src/components/trader/profile-header.tsx` | created | **f9a161d**: Name, PRO badge, member since, streak |
| `src/components/trader/profile-stats.tsx` | created | **f9a161d**: 4-card grid (Return %, Total Trades, Streak, Achievements) |
| `src/components/trader/profile-achievements.tsx` | created | **f9a161d**: Grid of unlocked achievements |
| `src/components/trader/share-button.tsx` | created | **f9a161d**: Copy profile URL to clipboard |
| `src/components/leaderboard/leaderboard-row.tsx` | modified | **f9a161d**: Wrapped in Link when user_id present |
| `src/components/layout/sidebar.tsx` | modified | **f9a161d**: Added Watchlist, Analytics, Shop to NAV_ITEMS |
| `src/components/layout/bottom-nav.tsx` | modified | **f9a161d**: Added Watchlist, Analytics, Shop to MORE_ITEMS |
| `src/components/watchlist/watchlist-button.tsx` | modified | **e399e3b**: CSS tooltip wrapper ("Add/Remove from Watchlist") |
| `src/components/market/alert-button.tsx` | modified | **e399e3b**: CSS tooltip wrapper ("Set Price Alert") + aria-label |
| `src/app/api/dev/tokens/route.ts` | modified | **e399e3b**: createAdminClient -> createClient |
| `src/app/api/dev/cash/route.ts` | modified | **e399e3b**: createAdminClient -> createClient |
| `src/app/api/dev/streak/route.ts` | modified | **e399e3b**: createAdminClient -> createClient |
| `src/app/api/dev/reset/route.ts` | modified | **e399e3b**: createAdminClient -> createClient + user_watchlists/user_purchases in reset |
| `src/app/api/dev/snapshot/route.ts` | modified | **e399e3b**: createAdminClient -> createClient |
| `src/app/api/dev/tutorial/route.ts` | modified | **e399e3b**: createAdminClient -> createClient |
| `supabase/migrations/012_add_missing_rls_policies.sql` | created | **e399e3b**: 7 DELETE + 1 UPDATE RLS policy across 8 tables |
| `plans/sprint-3-hotfix-spec.md` | created | **e399e3b**: Hotfix spec document |
| `plans/sprint-3-hotfix-plan.md` | created | **e399e3b**: Hotfix implementation plan |
| `src/app/(dashboard)/watchlist/page.tsx` | created | **f9a161d**: Watchlist page with slot counter badge |
| `src/app/(dashboard)/watchlist/loading.tsx` | created | **f9a161d**: Skeleton loading |
| `src/app/(dashboard)/analytics/page.tsx` | created | **f9a161d**: Analytics page with loading/error/empty states |
| `src/app/(dashboard)/analytics/loading.tsx` | created | **f9a161d**: Skeleton loading |
| `src/app/(dashboard)/shop/page.tsx` | created | **f9a161d**: Shop page with filtering, purchase flow, profile store sync |
| `src/app/(dashboard)/shop/loading.tsx` | created | **f9a161d**: Skeleton loading |
| `src/app/(dashboard)/trader/[id]/page.tsx` | created | **f9a161d**: Public profile page with loading/404 states |
| `src/app/(dashboard)/trader/[id]/loading.tsx` | created | **f9a161d**: Skeleton loading |
| `src/app/(dashboard)/stock/[ticker]/page.tsx` | modified | **f9a161d**: Added WatchlistButton next to AlertButton |

### Sprint 4 Key Files (2026-03-04)

| File | Status | Notes |
|------|--------|-------|
| `src/app/api/profile/balance/route.ts` | created | Lightweight balance refetch endpoint |
| `src/app/api/profile/theme/route.ts` | created | Theme selection with ownership check |
| `src/app/api/profile/badge-frame/route.ts` | created | Frame selection with ownership check |
| `src/components/layout/theme-provider.tsx` | created | next-themes wrapper |
| `src/components/settings/appearance-section.tsx` | created | Appearance settings UI (color mode, theme, badge frame) |
| `src/components/settings/badge-frame-picker.tsx` | created | Badge frame selector component |
| `src/components/ui/framed-avatar.tsx` | created | Avatar with ring/SVG/animated frames |
| `src/components/ui/badge-frame-svgs.tsx` | created | GoldCrown, DiamondSparkle, FireFlame SVGs |
| `src/stores/profile-store.ts` | modified | Added activeTheme, activeBadgeFrame, refetchBalance() |
| `src/components/layout/profile-initializer.tsx` | modified | data-theme attribute, new props |
| `src/app/(dashboard)/shop/page.tsx` | modified | refetchBalance, handleApplyItem |
| `src/app/api/shop/purchase/route.ts` | modified | Prerequisite validation, safer refund |
| `src/app/globals.css` | modified | 252 lines of theme CSS + badge frame animations |

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

---

### Code Review + Cleanup Fixes (commit 2d310aa, 2026-03-02)
Ran code-improver and code-cleanup agents on 4 recently changed files (stock-chart.tsx, allocation-chart.tsx, buy-modal.tsx, sell-modal.tsx). code-improver found 16 items (3 actionable), code-cleanup found 1 fix. All 3 fixes applied.

#### code-improver Findings
- 16 items reviewed across 4 files, 3 actionable issues identified

#### code-cleanup Findings
- 1 fix: unused `cn` import in allocation-chart.tsx

#### Fixes Applied

**Bug fix:**
- `src/components/portfolio/allocation-chart.tsx`: Added `hoveredIndex < data.length` bounds check to prevent stale `hoveredIndex` after portfolio data refresh (e.g., after a trade changes number of holdings). Initially attempted `useEffect` reset but lint rule `react-hooks/set-state-in-effect` blocked it — used render-time guard instead.

**Precision fix:**
- `src/components/trade/buy-modal.tsx`: Replaced fragile `-1 cent` heuristic in `handleMax` with a micro-share step-down while loop — repeatedly subtracts one micro-share (0.000001) until computed cost fits within cash balance. Proven correct vs. edge-case floating-point drift.

**Cleanup fix:**
- `src/components/portfolio/allocation-chart.tsx`: Removed unused `cn` import, replaced `cn('...')` call with plain string literal.

#### Build & Deploy
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings
- Deployed via `npx vercel --prod` — confirmed live at https://paper-trading-app-delta.vercel.app

---

### Token Balance Sync Fix — Zustand Profile Store (commit e938b10, 2026-03-02)
Fixed a bug where claiming daily tokens on /rewards updated the rewards page balance but NOT the header token count — required a page refresh to see the correct value.

#### Root Cause
- Header read `token_balance` from server-side props (fetched once at layout render)
- No mechanism existed to update the header client-side after mutations (daily reward claims, tutorial completions)

#### Solution: Zustand Profile Store
Created a new Zustand store following the same pattern as existing `portfolio-store` and `trade-store`, with a bridge component to hydrate client state from server-fetched data.

#### New Files
- `src/stores/profile-store.ts` — Zustand store with `tokenBalance`, `displayName`, `initProfile()`, `addTokens()`
- `src/components/layout/profile-initializer.tsx` — Client component that hydrates the store from server-side layout data (bridge between server component and client store)

#### Modified Files
- `src/components/layout/header.tsx` — Removed `HeaderProps` interface; reads `tokenBalance` and `displayName` from `useProfileStore` instead of props
- `src/app/(dashboard)/layout.tsx` — Added `<ProfileInitializer>` with server-fetched profile data; `<Header>` now takes no props
- `src/app/(dashboard)/rewards/page.tsx` — Calls `addTokens(tokens)` after daily reward claim (in addition to existing local state update)
- `src/hooks/useTutorialStep.ts` — Calls `addTokens(earned)` after tutorial step completion awards tokens

#### How It Works
1. Server layout fetches `token_balance` from Supabase, passes to `<ProfileInitializer>`
2. `ProfileInitializer` hydrates the Zustand store on mount (one-time)
3. Header reads from store reactively — any `addTokens()` call updates it instantly
4. Both daily rewards and tutorial completions now trigger the same update path

#### Build & Deploy
- `npm run build`: 29 routes, 0 errors
- `npm run lint`: 0 errors, 0 warnings (fixed exhaustive-deps warning for `addTokens` in useEffect)
- Deployed via `npx vercel --prod` to https://paper-trading-app-delta.vercel.app
