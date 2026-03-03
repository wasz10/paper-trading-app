# STRIDE Security Review — Paper Trading App

**Last Updated:** 2026-03-02
**Scope:** Full application — 9 commits since PR #1, 28 files, +1,441/-133 lines

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | — |
| High | 4 | All fixed |
| Medium | 9 | 7 fixed, 2 accepted |
| Low | 11 | 7 fixed, 4 accepted |
| Informational | 6 | Accepted |

---

## Review Round 3 — Comprehensive 9-Commit Review

### High (Fixed)

#### H-1: Leaderboard queries blocked by RLS (functionally broken)
- **File:** `src/app/api/leaderboard/route.ts:43-58`
- **Issue:** Used `createClient()` (RLS-scoped) to query all users/holdings — RLS only returns current user's rows, making leaderboard show 1 entry
- **Fix:** Switched users/holdings queries to `createAdminClient()`, consolidated with existing admin client usage for snapshots

#### H-2: Account deletion uses wrong column for `users` table
- **File:** `src/app/api/account/delete/route.ts:48,53`
- **Issue:** `.eq('user_id', user.id)` on `users` table whose PK is `id` — silently deletes nothing, then either orphans data or blocks deletion
- **Fix:** Separated `users` table delete with `.eq('id', user.id)`, other tables continue using `user_id`

### Previously Fixed (Rounds 1-2)

#### H-3: Leaderboard user_id exposure (Round 1)
- **Fix:** Removed `user_id` from response, replaced with `is_current_user` boolean

#### H-4: Unbounded Yahoo Finance API calls (Round 1)
- **Fix:** Added server-side quote caching (60s TTL)

---

### Medium (Fixed)

#### M-1: Rate limiter unbounded memory growth
- **File:** `src/lib/rate-limit.ts:6`
- **Issue:** `Map` grows indefinitely with no eviction of expired entries
- **Fix:** Added periodic sweep every 100 calls + hard cap at 10,000 entries

#### M-2: Non-constant-time site password comparison
- **File:** `src/app/api/gate/verify/route.ts:28`
- **Issue:** `password !== sitePassword` leaks timing information on primary access gate
- **Fix:** Compare HMAC of both values — attacker can't infer password from HMAC comparison timing

#### M-3: Dev panel open to all authenticated users (Round 2)
- **Fix:** `checkDevAccess()` guard with `DEV_ALLOWED_EMAILS` allowlist

#### M-4: Account deletion cascade continues on failure (Round 2)
- **Fix:** Accumulate errors, abort before auth deletion if any table fails

#### M-5: Gate brute-force (Round 2)
- **Fix:** IP-based rate limiting (5 req/min)

#### M-6-8: Tutorial/reward race conditions, no rate limiting (Round 1)
- **Fix:** Optimistic locking on `token_balance`, in-memory rate limiter on leaderboard

#### M-9: Leaderboard period parameter not validated
- **File:** `src/app/api/leaderboard/route.ts:20`
- **Fix:** Validate against `['daily', 'weekly', 'all-time']`, return 400 for unknown periods

### Medium (Accepted)

#### M-10: Tutorial TOCTOU on JSONB steps_completed
- **File:** `src/app/api/tutorial/complete/route.ts:48-74`
- **Risk:** Concurrent requests for different steps could overwrite each other's JSONB update
- **Mitigation:** `token_balance` optimistic lock prevents double-awards; step loss is low-probability and low-impact (user retries)

#### M-11: Reward token transaction not atomic with balance update
- **File:** `src/app/api/rewards/claim/route.ts:74-80`
- **Risk:** Balance update commits but transaction log insert fails
- **Mitigation:** Outer try/catch returns 500; audit trail gap is cosmetic for paper trading

---

### Low (Fixed)

- Cookie `secure` flag added for production (Round 2)
- `/dev` added to middleware protected routes (Round 2)
- HMAC function extracted to shared `src/lib/crypto.ts` (Round 2)
- Upper-bound validation on dev numeric inputs (Round 2)
- User ID removed from dev status response (Round 2)
- Integer validation (`Number.isInteger`) for token/streak dev inputs (Round 3)
- Leaderboard admin client consolidated (Round 3)

### Low (Accepted)

- No re-authentication for account deletion (display name confirmation adequate for paper trading)
- No rate limiting on dev endpoints (gated by email allowlist)
- No CSRF tokens (mitigated by JSON Content-Type + SameSite cookies)
- API routes not in middleware auth check (defense-in-depth gap, each route checks auth individually)

---

## Positive Findings

- Trade execution uses server-fetched prices with optimistic locking on cash_balance
- Admin client (service role key) scoped to server-only code
- Supabase RLS enabled on all 8 tables
- Tutorial steps validated against known step IDs
- React auto-escapes reflected parameters — no XSS vectors
- HMAC-SHA256 cookie integrity for site password gate
- Dev panel triple-gated: env var + email allowlist + middleware auth
- Account deletion cascades correctly with abort-on-failure + column-aware delete
- Rate limiting: gate (IP-based, 5/min), leaderboard (user-based, 10/min), limiter self-evicts
- Constant-time password comparison via HMAC
