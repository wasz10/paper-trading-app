# Sprint 3 Hotfix — Implementation Plan

## Summary
2 fixes, 8 files modified, 0 new files, 0 new dependencies.

---

## Task 1: Add Tooltips to Stock Page Buttons

### 1a. WatchlistButton tooltip
**File:** `src/components/watchlist/watchlist-button.tsx`

- Wrap the `<Button>` in a `<div className="group relative">`
- Add a `<span>` tooltip after the Button using the header CSS pattern
- Tooltip text is dynamic: `isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'`
- While loading (`isLoading=true`), show "Watchlist"

### 1b. AlertButton tooltip
**File:** `src/components/market/alert-button.tsx`

- The AlertButton uses `<DialogTrigger asChild>` wrapping the `<Button>` — tooltip must be added inside the `<Dialog>` but wrapping the trigger
- Wrap `<DialogTrigger>` in a `<div className="group relative">`
- Add tooltip `<span>` with text "Set Price Alert"
- Add `aria-label="Set price alert"` to the Button

---

## Task 2: Fix Dev Panel Server Errors

### 2a. Switch dev POST routes from admin to RLS client
**Files (6):**
- `src/app/api/dev/tokens/route.ts`
- `src/app/api/dev/cash/route.ts`
- `src/app/api/dev/streak/route.ts`
- `src/app/api/dev/reset/route.ts`
- `src/app/api/dev/snapshot/route.ts`
- `src/app/api/dev/tutorial/route.ts`

**Change in each:**
```diff
- import { createAdminClient } from '@/lib/supabase/admin'
+ import { createClient } from '@/lib/supabase/server'
...
- const admin = createAdminClient()
+ const supabase = await createClient()
```
Then replace all `admin.from(...)` with `supabase.from(...)`.

### 2b. Add Sprint 3 tables to reset route
**File:** `src/app/api/dev/reset/route.ts`

Add `'user_watchlists'` and `'user_purchases'` to the `tablesToClear` array (before `trades` and `holdings` to respect any future FK ordering).

---

## File Change Summary

| # | File | Change |
|---|------|--------|
| 1 | `src/components/watchlist/watchlist-button.tsx` | Add CSS tooltip wrapper |
| 2 | `src/components/market/alert-button.tsx` | Add CSS tooltip wrapper + aria-label |
| 3 | `src/app/api/dev/tokens/route.ts` | `createAdminClient` → `createClient` |
| 4 | `src/app/api/dev/cash/route.ts` | `createAdminClient` → `createClient` |
| 5 | `src/app/api/dev/streak/route.ts` | `createAdminClient` → `createClient` |
| 6 | `src/app/api/dev/reset/route.ts` | `createAdminClient` → `createClient` + add new tables |
| 7 | `src/app/api/dev/snapshot/route.ts` | `createAdminClient` → `createClient` |
| 8 | `src/app/api/dev/tutorial/route.ts` | `createAdminClient` → `createClient` |

---

## Verification
1. `npm run build` — 0 errors
2. `npm run lint` — 0 warnings
3. Manual test: hover star/bell on stock page → tooltips appear
4. Manual test: dev panel → set tokens, set cash, reset all work without 500
