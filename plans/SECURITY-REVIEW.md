# STRIDE Security Review — Paper Trading App

**Last Updated:** 2026-03-02
**Scope:** Full application security review including latest features (site password gate, account deletion, developer panel)

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 0 | — |
| High | 2 | Fixed (I-1, D-1 in security hardening commits) |
| Medium | 6 | Fixed (T-3, T-4, T-5, D-3 in security commits; E-1, T-8 in review fix commit) |
| Low | 7 | 3 fixed, 4 accepted |
| Informational | 4 | Accepted |

---

## Previously Identified (Phase 10 — now fixed)

### High (Fixed)
- **I-1:** Leaderboard user_id exposure → Removed, replaced with `is_current_user` boolean
- **D-1:** Unbounded Yahoo Finance API calls → Added server-side quote caching (60s TTL)

### Medium (Fixed)
- **T-3:** Tutorial double-token race → Optimistic lock on `token_balance`
- **T-4:** Daily reward double-claim → Optimistic lock on `last_login_date`
- **T-5:** Non-atomic token_balance → Optimistic locking pattern
- **D-3:** No rate limiting → In-memory rate limiter on leaderboard (10 req/min)
- **I-2:** Leaderboard leaks fields → Trimmed to display_name, return_pct, is_subscriber, is_current_user
- **S-1:** Per-handler auth only → Leaderboard now requires auth; middleware guards protected routes

---

## Current Review (Gate, Deletion, Dev Panel)

### Medium (Fixed in review commit)

#### E-1: Dev panel accessible to all authenticated users
- **Files:** All `src/app/api/dev/*/route.ts`
- **Risk:** Any user could manipulate their state when `DEV_PANEL_ENABLED=true`
- **Fix:** Added `checkDevAccess()` guard with `DEV_ALLOWED_EMAILS` email allowlist

#### T-8: Account deletion cascade continues on failure
- **File:** `src/app/api/account/delete/route.ts`
- **Risk:** Auth user deleted with orphaned data remaining
- **Fix:** Accumulate errors, abort before auth deletion if any table fails

#### D-2: No rate limiting on gate password verification
- **File:** `src/app/api/gate/verify/route.ts`
- **Risk:** Brute-force site password
- **Fix:** Added IP-based rate limiting (5 attempts/min)

#### T-9: Admin client used without authorization scoping in dev routes
- **Files:** All dev API routes
- **Risk:** RLS bypass for any authenticated user
- **Fix:** Resolved via E-1 fix (email allowlist)

### Low (Fixed in review commit)

#### I-3: Site password cookie missing `secure` flag
- **File:** `src/app/api/gate/verify/route.ts`
- **Fix:** Added `secure: process.env.NODE_ENV === 'production'`

#### S-2: `/dev` page not in middleware protected routes
- **File:** `src/lib/supabase/middleware.ts`
- **Fix:** Added `pathname.startsWith('/dev')` to `isProtectedRoute`

#### T-10: HMAC function duplicated in two files
- **Files:** middleware.ts and gate/verify/route.ts
- **Fix:** Extracted to shared `src/lib/crypto.ts`

### Low (Accepted)

- **T-7:** No upper bounds on dev panel numeric inputs → Added max bounds (tokens: 100K, cash: $1M, streak: 365)
- **I-4:** Non-constant-time password comparison → Low practical risk over network
- **S-3:** Weak deletion confirmation (display name) → Adequate for paper trading
- **I-5:** No explicit CSRF tokens → Mitigated by JSON Content-Type + SameSite cookies

### Informational (Accepted)

- Dev status endpoint no longer exposes user ID (removed from response)
- `/api/cron` exempted from gate — cron routes independently verify `CRON_SECRET` bearer token
- Account deletion confirmation is case-sensitive — acceptable UX

---

## Positive Findings

- Trade execution uses server-fetched prices with optimistic locking on cash_balance
- Admin client (service role key) scoped to server-only code
- Supabase RLS enabled on all 8 tables
- Tutorial steps validated against known step IDs
- React auto-escapes reflected parameters — no XSS vectors
- HMAC-SHA256 cookie integrity for site password gate
- Dev panel double-gated: env var + email allowlist + middleware auth
- Account deletion confirms name match + aborts on cascade failure
- Rate limiting on gate (IP-based) and leaderboard (user-based)
