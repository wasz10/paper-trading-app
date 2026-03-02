# STRIDE Security Review — Phase 10 Changes

**Date:** 2026-03-02
**Scope:** Commits fdf82f1..HEAD (~20 commits, 20 files changed, +1,121 / -184 lines)

---

## Summary

| Severity | Count | New | Pre-existing |
|----------|-------|-----|-------------|
| Critical | 0 | - | - |
| High | 2 | 2 | 0 |
| Medium | 6 | 3 | 3 (amplified) |
| Low | 5 | 2 | 3 |
| Informational | 10 | 6 | 4 |

**No critical vulnerabilities found.** Two high-severity items should be addressed before a public launch.

---

## High Severity

### I-1: Leaderboard exposes user_id (Supabase UUID) for all users
- **File:** `src/app/api/leaderboard/route.ts`
- **Risk:** Enables user enumeration; leaks internal auth identifiers even when `show_display_name` is false
- **Fix:** Remove `user_id` from the leaderboard API response or replace with a non-reversible public ID

### D-1: Leaderboard fetches live Yahoo Finance quotes for every unique ticker across all users
- **File:** `src/app/api/leaderboard/route.ts`
- **Risk:** Unbounded outbound API calls per request; amplifiable by concurrent users
- **Fix:** Use `portfolio_snapshots` for leaderboard calculations instead of live prices, or add server-side quote caching with TTL

---

## Medium Severity

### T-3: Race condition in tutorial step completion (double-token award)
- **File:** `src/app/api/tutorial/complete/route.ts`
- **Risk:** Two concurrent requests for the same step can both award tokens
- **Fix:** Use atomic DB operation (RPC with `SELECT ... FOR UPDATE`) or unique constraint on step completion

### T-4: Race condition in daily reward claim (double-claim)
- **File:** `src/app/api/rewards/claim/route.ts`
- **Risk:** Two concurrent requests can both read `canClaim=true` and award tokens
- **Fix:** Add optimistic lock `.eq('last_login_date', profile.last_login_date)` on update, or rely on `daily_rewards` unique constraint

### T-5: Non-atomic read-then-write on token_balance
- **Files:** Tutorial complete + reward claim routes
- **Risk:** Concurrent token operations can lose updates
- **Fix:** Use SQL increment (`token_balance = token_balance + $1`) instead of read-compute-write

### I-2: Leaderboard response includes `is_subscriber` and `show_display_name` fields
- **File:** `src/app/api/leaderboard/route.ts`
- **Risk:** Leaks subscription status for all users
- **Fix:** Only SELECT and return the columns needed by the frontend

### D-3: No rate limiting on any API endpoint
- **Files:** All API routes
- **Risk:** Spam potential on trade, leaderboard, and quote endpoints
- **Fix:** Add rate limiting middleware (IP + user ID based)

### S-1: API routes lack middleware-level auth; rely on per-handler checks
- **File:** `src/lib/supabase/middleware.ts`
- **Risk:** If a handler forgets auth check, route is publicly accessible
- **Fix:** Add `/api/*` (excluding `/api/cron/*`) to middleware protected routes as defense-in-depth

---

## Low Severity

- **T-2:** Client-side token balance in Zustand is cosmetic-only — no server trust (acceptable)
- **T-6/T-7:** Buy/sell endpoints lack upper bound validation on amount/shares — mitigated by balance checks
- **S-3:** No CSRF tokens — mitigated by SameSite=Lax cookies
- **R-2:** Token transaction log insert errors are silently ignored

---

## Positive Findings

- Trade execution correctly uses server-fetched prices, not client-provided values
- Trading engine uses optimistic locking on cash_balance to prevent double-spend
- Admin client (service role key) is properly scoped to server-only code
- Tutorial steps validated against known step IDs — cannot create fake steps
- Supabase RLS enabled on all 8 tables
- React auto-escapes reflected parameters — no XSS vectors
