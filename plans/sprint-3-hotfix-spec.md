# Sprint 3 Hotfix — Spec

## Overview

Two issues to fix in a single patch:

1. **Tooltips on stock page action buttons** — Star (watchlist) and Bell (alert) icon buttons have no hover labels, leaving users unsure what they do.
2. **Dev panel server errors** — All mutation operations (set tokens, set cash, set streak, reset, snapshot, tutorial) return 500 because `createAdminClient()` throws when `SUPABASE_SERVICE_ROLE_KEY` is missing from the environment.

---

## Feature 1: Tooltips on Stock Page Buttons

### Problem
On `/stock/[ticker]`, the WatchlistButton (star icon) and AlertButton (bell icon) are unlabeled icon-only buttons. Users — especially first-time visitors — don't know what they do until they click.

### Desired Behavior

| Button | Tooltip text | Dynamic? |
|--------|-------------|----------|
| WatchlistButton (star) | **"Add to Watchlist"** when not in watchlist; **"Remove from Watchlist"** when in watchlist | Yes — changes with toggle state |
| AlertButton (bell) | **"Set Price Alert"** | No — static label |

### UI Pattern
Reuse the **existing CSS tooltip pattern** from `src/components/layout/header.tsx`:

```tsx
<div className="group relative">
  <Button ...>{icon}</Button>
  <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border opacity-0 group-hover:opacity-100 transition-opacity">
    Tooltip text
  </span>
</div>
```

No new dependencies needed. No shadcn Tooltip or Radix install required.

### Accessibility
- `aria-label` already exists on WatchlistButton (dynamic). Add missing `aria-label="Set price alert"` to AlertButton.
- CSS tooltips are `pointer-events-none` and purely visual — the `aria-label` provides the screenreader equivalent.

---

## Feature 2: Dev Panel Server Error Fix

### Root Cause Analysis

The dev panel page (`/dev`) loads successfully because `GET /api/dev/status` uses `createClient()` (cookie-based Supabase client with the anon key). But all 6 POST mutation routes use `createAdminClient()`, which requires `SUPABASE_SERVICE_ROLE_KEY`:

```ts
// src/lib/supabase/admin.ts
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY ...')
  }
  ...
}
```

If `SUPABASE_SERVICE_ROLE_KEY` is not set in the current environment (e.g., not in `.env.local` for local dev, or not configured on Vercel), every POST route catches the thrown error and returns `{ error: 'Server error', status: 500 }`.

**Current `.env.local` contents** (only 3 vars):
- `SITE_PASSWORD`
- `DEV_PANEL_ENABLED`
- `DEV_ALLOWED_EMAILS`

**Missing**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

### Fix Approach

**Option A — Switch dev routes to use RLS client instead of admin client:**
The dev mutation routes don't actually need admin access. The authenticated user is modifying their OWN row in `users`, which RLS already allows. Change all dev POST routes from `createAdminClient()` to `createClient()`.

Exception: the `reset` route deletes from multiple tables (`trades`, `holdings`, etc.) — RLS policies already allow users to delete their own rows via `user_id = auth.uid()`.

Exception: the `tutorial` route uses `upsert` — this also works with the RLS client since it's the user's own tutorial_progress row.

**Option B — Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`:**
Just add the missing env var. Quick fix but doesn't address the architectural issue.

### Recommended: Option A
Switching to `createClient()` is safer (least-privilege), works in any environment without requiring the service role key, and matches the pattern the status route already uses.

### Additional Fix: Reset Route Missing New Tables
The `reset` route clears `tutorial_progress`, `token_transactions`, `daily_rewards`, etc. but doesn't clear the two Sprint 3 tables:
- `user_watchlists`
- `user_purchases`

These should be added to the `tablesToClear` array to ensure a complete account reset.

---

## Out of Scope
- No new pages or navigation changes
- No new dependencies
- No database migrations
