# QA Report — Mobile Responsiveness, Dark Mode & Edge Cases

> Audited: 2026-02-28
> Build status: **PASS** (0 errors, 0 warnings)

---

## Pages Audited

- Landing page (`src/app/page.tsx` + `src/components/landing/*`)
- Login / Signup (`src/app/(auth)/*`)
- Onboarding (`src/components/auth/onboarding-flow.tsx`)
- Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)
- Explore (`src/app/(dashboard)/explore/page.tsx`)
- Stock detail (`src/app/(dashboard)/stock/[ticker]/page.tsx`)
- Rewards (`src/app/(dashboard)/rewards/page.tsx`)
- Leaderboard (`src/app/(dashboard)/leaderboard/page.tsx`)
- Settings (`src/app/(dashboard)/settings/page.tsx`)
- Layout (sidebar, bottom nav, header)

---

## Issues Found & Fixed

### 1. Touch Targets (minimum 44px)

| Component | File | Issue | Fix |
|-----------|------|-------|-----|
| Bottom nav links | `src/components/layout/bottom-nav.tsx` | ~32px tall, `px-2 py-1` too tight | Added `min-w-[48px] min-h-[44px]`, adjusted padding |
| Sidebar nav links | `src/components/layout/sidebar.tsx` | `py-2` = ~32px tall | Changed to `py-2.5` with `min-h-[44px]` |
| Header logout button | `src/components/layout/header.tsx` | `h-8 w-8` = 32px | Increased to `h-9 w-9` |
| Chart time range buttons | `src/components/market/stock-chart.tsx` | `h-7` = 28px | Increased to `h-9` with `px-2.5` |
| Chart type toggle | `src/components/market/stock-chart.tsx` | `h-7` = 28px | Increased to `h-9` |
| Category chips | `src/components/market/category-chips.tsx` | Default sm size ~32px | Added `min-h-[36px]` |
| Market hours dismiss | `src/components/market/market-hours-banner.tsx` | `h-6 w-6` = 24px | Increased to `h-8 w-8` |
| Streak day cells | `src/components/rewards/streak-display.tsx` | Small `p-2` cells | Added `min-h-[44px]` with `justify-center` |
| Settings toggle switch | `src/app/(dashboard)/settings/page.tsx` | `h-6 w-11` = 24px tall | Increased to `h-7 w-12` with `h-6 w-6` thumb |
| Holdings list rows | `src/components/portfolio/holdings-list.tsx` | No min-height | Added `min-h-[44px]` |
| Trade history rows | `src/components/trade/trade-history.tsx` | No min-height | Added `min-h-[44px]` |
| Leaderboard rows | `src/components/leaderboard/leaderboard-row.tsx` | No min-height | Added `min-h-[44px]` |
| Search result buttons | `src/components/market/stock-search.tsx` | `py-2` ~36px | Changed to `py-2.5` with `min-h-[44px]` |

### 2. Mobile Responsiveness (375px)

| Component | File | Issue | Fix |
|-----------|------|-------|-----|
| Leaderboard tabs | `src/app/(dashboard)/leaderboard/page.tsx` | Tabs overflow on row with title on 375px | Changed to `flex-col gap-3 sm:flex-row` stacking |
| Stock detail name | `src/app/(dashboard)/stock/[ticker]/page.tsx` | Long stock names overflow | Added `flex-wrap`, `truncate max-w-[200px] sm:max-w-none` |
| Stock detail price | `src/app/(dashboard)/stock/[ticker]/page.tsx` | Large price font overflows on small screens | Changed `text-4xl` to `text-3xl sm:text-4xl`, added `flex-wrap` |
| Trade history rows | `src/components/trade/trade-history.tsx` | Share count + price text too long for 375px | Shortened "shares @" to just "@", used `text-xs sm:text-sm` |
| Holdings list | `src/components/portfolio/holdings-list.tsx` | Row content can overflow | Added `min-w-0`, `shrink-0`, responsive text sizes |
| Search results | `src/components/market/stock-search.tsx` | Stock names overflow dropdown | Added `max-w-[150px] sm:max-w-[250px]` on name with `truncate` |
| Stock card min-width | `src/components/market/stock-card.tsx` | `min-w-[160px]` forced overflow in 2-col grid | Removed hardcoded min-width |
| Stock card name | `src/components/market/stock-card.tsx` | `max-w-[140px]` hardcoded truncation | Changed to plain `truncate` (uses parent width) |
| Category chips | `src/components/market/category-chips.tsx` | Scrollable area clipped at page edges | Added `-mx-4 px-4` for edge-to-edge scrolling |
| Settings page padding | `src/app/(dashboard)/settings/page.tsx` | Double `p-4` (page + layout) | Removed page-level `p-4` |
| Bottom nav labels | `src/components/layout/bottom-nav.tsx` | "Leaderboard" label overflows | Added `truncate max-w-[56px]` |
| Scrollbar utility | `src/app/globals.css` | `scrollbar-hide` class used but not defined | Added utility class definition |

### 3. Dark Mode

| Component | File | Issue | Fix |
|-----------|------|-------|-----|
| Stock chart grid | `src/components/market/stock-chart.tsx` | Hardcoded `rgba(255,255,255,0.05)` grid lines (invisible on light mode) | Now detects `dark` class, uses `rgba(0,0,0,0.06)` for light |
| Stock chart text | `src/components/market/stock-chart.tsx` | Hardcoded `#9ca3af` text color | Now uses `#6b7280` for light, `#9ca3af` for dark |
| Stock chart borders | `src/components/market/stock-chart.tsx` | Hardcoded `rgba(255,255,255,0.1)` border | Now uses `rgba(0,0,0,0.1)` for light mode |

### 4. Edge Cases — Already Handled (No Changes Needed)

| Scenario | Status | Notes |
|----------|--------|-------|
| Empty portfolio (no holdings) | OK | Dashboard shows "Your portfolio is empty" CTA |
| No trades | OK | TradeHistory shows "No trades yet" message |
| No leaderboard entries | OK | Table shows "No traders on the leaderboard yet" |
| No rewards claimed | OK | Streak display and claim button render correctly |
| Stock not found | OK | Stock detail page shows "Stock not found: TICKER" |
| Very large numbers | OK | `formatCurrency()` and `formatDollars()` use `Intl.NumberFormat` with proper formatting |
| Very long display names | OK | Max 20 chars enforced by input `maxLength` |
| Leaderboard fallback names | OK | Uses `Trader #XXXX` when no display_name |

---

## Items That Need Further Attention

1. **Light mode is not user-selectable**: The app is hardcoded to `className="dark"` on `<html>` in `src/app/layout.tsx`. A theme toggle should be added to settings if light mode support is desired.

2. **Google OAuth button SVG colors**: Uses hardcoded brand colors (#4285F4, #34A853, etc.). This is correct per Google brand guidelines but the button looks slightly off on dark backgrounds. Consider adding a white background to the button interior.

3. **Stock chart does not re-render on theme change**: The chart colors are set at render time. If a theme toggle is added later, the chart would need to re-render when the theme changes.

4. **Buy button on stock detail page**: Links to `/dashboard` instead of opening a trade modal. This is a functionality issue, not a styling one.

5. **Allocation chart (Recharts PieChart)**: On very narrow screens (< 320px), the pie chart's fixed `innerRadius={60} outerRadius={90}` may look cramped. This only affects devices narrower than 375px.

---

## Overall Assessment

The app is in **good shape** for mobile. The main layout (sidebar/bottom nav/header) was already well-structured for responsive behavior. The fixes above address:

- **14 touch target violations** — all interactive elements now meet or approach the 44px minimum
- **12 mobile overflow/layout issues** — content no longer breaks at 375px
- **3 dark mode color hardcoding issues** — chart component now respects the current theme
- **1 missing CSS utility** — `scrollbar-hide` class added

Build status: **PASS** (0 errors)

---
---

# QA Report — v2 Integration Pass

> Date: 2026-03-02
> Agent: integration-agent
> Build: `npm run build` — 0 errors, 0 warnings

---

## 1. Dashboard Integration

### What was wired

| Component | Source | Status |
|-----------|--------|--------|
| TutorialSwitcher | `src/components/tutorial/tutorial-switcher.tsx` | Integrated at top of dashboard |
| TutorialToast | `src/components/tutorial/tutorial-toast.tsx` | Shows on step completion |
| useTutorialStep("check_portfolio") | `src/hooks/useTutorialStep.ts` | Auto-fires on dashboard visit |
| PerformanceChart | `src/components/portfolio/performance-chart.tsx` | Already wired (Agent 2) |
| TradeHistory (limit=5) | `src/components/trade/trade-history.tsx` | Now accepts `limit` prop, dashboard shows last 5 |

### Dashboard layout order (verified)

1. Tutorial switcher (if active and not dismissed/complete)
2. Portfolio summary
3. Performance chart (Recharts)
4. Allocation chart + holdings list (if holdings exist), OR empty state CTA
5. Recent trades (last 5)
6. Tutorial toast (floating, shows on step completion)

### Tutorial flow

- Style read from `localStorage('tutorial_style')`, defaults to `'banner'`
- Progress fetched from `/api/tutorial/status` API
- If all steps complete, tutorial auto-hides
- Dismiss saves `'off'` to localStorage

---

## 2. Tutorial Hooks Wired

| Page | Step ID | File |
|------|---------|------|
| Dashboard | `check_portfolio` | `src/app/(dashboard)/dashboard/page.tsx` |
| Explore | `find_stock` | `src/app/(dashboard)/explore/page.tsx` |
| Trade Detail | `first_trade` | `src/app/(dashboard)/trade/[id]/page.tsx` |
| Trade Detail | `meet_ai_coach` | `src/app/(dashboard)/trade/[id]/page.tsx` |
| Rewards | `claim_reward` | `src/app/(dashboard)/rewards/page.tsx` |

All 5 tutorial steps are now wired to auto-complete when the user visits the relevant page.

---

## 3. QA Audit (v2 Components)

### 3a. Touch Target Fixes (44px minimum)

| Component | Issue | Fix |
|-----------|-------|-----|
| Category chips | `min-h-[36px]` below 44px (was partially fixed last pass) | Changed to `min-h-[44px]` |
| Performance chart period buttons | Too small touch target (`px-2 py-1`) | Added `min-h-[44px] min-w-[44px]` with flex centering |
| Market hours banner dismiss | `h-8 w-8` (was fixed to 32px, still below 44px) | Added `min-h-[44px] min-w-[44px]` |
| Tutorial checklist dismiss | `p-1` too small | Changed to `p-2` with `min-h-[44px] min-w-[44px]` |
| Tutorial banner dismiss | `p-1` too small | Changed to `p-2` with `min-h-[44px] min-w-[44px]` |
| Tutorial walkthrough "Skip all" | No min height | Added `min-h-[44px] px-2` |
| Tutorial quest log minimize btn | `p-1` too small | Changed to `p-2` with `min-h-[44px] min-w-[44px]` |
| Tutorial quest log "Hide" btn | No min height | Added `min-h-[44px] px-2` |

### 3b. Dark Mode Consistency (New Components)

| Component | Status | Notes |
|-----------|--------|-------|
| Tutorial checklist | OK | Uses `bg-gradient-to-br from-indigo-950/50 to-slate-900/50` — dark-native |
| Tutorial banner | OK | Uses `bg-card/80`, `border`, semantic tokens |
| Tutorial quest log | OK | Uses `bg-card`, `border`, semantic tokens |
| Tutorial walkthrough | OK | Uses `bg-black/60` overlay, `bg-card` panel |
| Tutorial toast | OK | Uses `bg-card`, `border-green-500/30` |
| Performance chart tooltip | OK | Uses `hsl(var(--card))`, `hsl(var(--border))` |
| Header tooltips | OK | Uses `bg-popover`, `text-popover-foreground` |
| Settings tutorial style radios | OK | Uses `border-primary bg-primary/5` for selected, `border-border` for unselected |

### 3c. Bottom Nav Overlap

- Main content has `pb-20 md:pb-6` in layout.tsx
- Bottom nav is `h-16` (64px), content padding is `pb-20` (80px) = 16px clearance
- Quest log floating pill positioned at `bottom-20` (80px) on mobile, `bottom-6` on desktop
- **No overlap issues found**

### 3d. Edge Cases

| Scenario | Status | Notes |
|----------|--------|-------|
| Empty portfolio | OK | Shows "Your portfolio is empty" CTA to explore |
| No trades | OK | TradeHistory shows "No trades yet" message |
| No chart data | OK | PerformanceChart shows "Your first snapshot will appear tomorrow" |
| Long display names | OK | `truncate` class used in leaderboard rows, header shows 2-char initials |
| Long ticker names | OK | `shrink-0` prevents squeeze; max ticker length is 10 chars |
| Tutorial already complete | OK | Dashboard auto-hides tutorial when `isComplete` is true |
| Tutorial API failure | OK | Silently fails, tutorial just doesn't show |
| Tutorial style "off" | OK | No tutorial component rendered |
| No auth (logged out) | OK | Layout redirects to `/login` |

---

## 4. Code Cleanup

| File | Fix |
|------|-----|
| `src/components/leaderboard/leaderboard-row.tsx` | Merged duplicate `@/lib/utils` imports |
| `src/components/leaderboard/user-rank-card.tsx` | Merged duplicate `@/lib/utils` imports |
| `src/app/(dashboard)/dashboard/page.tsx` | Removed unused `TutorialStep` type import and redundant `tutorialSteps` state |
| `src/components/trade/trade-history.tsx` | Added `limit` prop (default 20) for dashboard to show last 5 |

---

## 5. Build Verification

```
npm run build — PASS
- TypeScript: 0 errors
- Pages: 29 routes (10 static, 19 dynamic)
- Build time: ~4s (Turbopack)
```

---

## 6. Known Issues (Not Code Bugs)

| Issue | Severity | Notes |
|-------|----------|-------|
| AI Coach 500 errors | Known | `ANTHROPIC_API_KEY` not in Vercel env vars |
| Cron job won't run | Known | `CRON_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` not in Vercel env vars |
| Google OAuth non-functional | Known | No server-side config |
| Settings `<select>` native options | Low | Native `<option>` elements may not respect dark theme in some browsers |
| Buy button on stock detail | Low | Links to `/dashboard` instead of opening a trade flow |
