# Sprint 4 Plan — Token Sync, Themes, Badge Frames

## Summary
3 features, ~30 files (12 new, ~18 modified), 1 migration, parallel agent execution.

---

## Agent 1: Token Balance Sync

**Goal:** Fix header token count drifting from shop/rewards pages.

### New Files
1. `src/app/api/profile/balance/route.ts` — `GET` endpoint returning `{ tokenBalance, cashBalance }` from DB
2. *(none else)*

### Modified Files
3. `src/stores/profile-store.ts` — Add `refetchBalance()` method that fetches `/api/profile/balance` and updates store. Add `activeTheme`, `activeBadgeFrame` fields + setters (shared with Agent 2/3).
4. `src/components/layout/profile-initializer.tsx` — Accept and pass `activeTheme`, `activeBadgeFrame` props
5. `src/app/(dashboard)/layout.tsx` — Fetch `active_theme, active_badge_frame` in the select query, pass to `ProfileInitializer`
6. `src/app/(dashboard)/shop/page.tsx` — After purchase: call `refetchBalance()` instead of `addTokens()`. Remove local `balance` state, use store.
7. `src/app/(dashboard)/rewards/page.tsx` — After daily/challenge claim: call `refetchBalance()` instead of `addTokens()`

### Patterns
- `refetchBalance()` is a simple `fetch('/api/profile/balance').then(json => set({ tokenBalance, cashBalance }))`
- Pages that display their own balance from API can still do so, but also call `refetchBalance()` to sync the header

---

## Agent 2: Theme System

**Goal:** Full color scheme themes with light/dark mode toggle, applied from shop + settings.

### New Files
1. `src/components/layout/theme-provider.tsx` — Wraps `next-themes` `ThemeProvider` with `attribute="class"` for dark/light + a context for color theme
2. `src/components/settings/appearance-section.tsx` — New settings card: theme picker (shows owned themes as selectable cards) + dark/light mode toggle
3. `src/app/api/profile/theme/route.ts` — `POST { theme: string | null }` — validates ownership, updates `users.active_theme`

### Modified Files
4. `src/app/layout.tsx` — Remove hardcoded `className="dark"`, wrap with `ThemeProvider`, add `suppressHydrationWarning` to `<html>`
5. `src/app/globals.css` — Add themed CSS variable blocks:
   - `:root` (Classic Light) — already exists
   - `.dark` (Classic Dark) — already exists
   - `[data-theme="midnight"]` (Midnight Light) + `[data-theme="midnight"].dark` (Midnight Dark)
   - `[data-theme="sunset"]` (Sunset Light) + `[data-theme="sunset"].dark` (Sunset Dark)
   - `[data-theme="forest"]` (Forest Light) + `[data-theme="forest"].dark` (Forest Dark)
6. `src/app/(dashboard)/settings/page.tsx` — Import and render `AppearanceSection` between Profile and Tutorial cards
7. `src/components/shop/shop-item-card.tsx` — For theme/badge items: show "Apply" / "Applied" button when owned (instead of disabled "Owned")
8. `src/app/(dashboard)/shop/page.tsx` — Add `handleApplyItem()` callback, pass `activeTheme`/`activeBadgeFrame` to cards for "Applied" state
9. `src/types/shop.ts` — Add optional `requiresItemId?: string` field to `ShopItem` for upgrade prerequisites
10. `src/app/api/shop/items/route.ts` — Return `active_theme` and `active_badge_frame` alongside items for "Applied" state

### Theme CSS Design (oklch color space, matching existing pattern)

**Midnight Blue:**
- Dark: Deep navy background (`oklch(0.15 0.03 260)`), blue card surfaces, blue accent
- Light: Cool white-blue background, blue-tinted cards, deep blue accents

**Sunset Orange:**
- Dark: Warm dark background (`oklch(0.15 0.02 50)`), amber-tinted cards, orange accent
- Light: Warm cream background, amber cards, orange accents

**Forest Green:**
- Dark: Deep green-tinted dark (`oklch(0.15 0.02 150)`), green-tinted cards, emerald accent
- Light: Light green-cream background, sage cards, green accents

### Theme Application Mechanism
- `next-themes` manages `class="dark"` on `<html>` via localStorage (mode)
- Custom JS in `ProfileInitializer` sets `data-theme="midnight"` on `<html>` from DB value
- CSS selectors like `[data-theme="midnight"].dark { --background: ... }` override defaults

---

## Agent 3: Badge Frame System

**Goal:** Tiered upgradable badge frames displayed on all avatars.

### New Files
1. `src/components/ui/framed-avatar.tsx` — Shared avatar component that renders ring/SVG/animated based on `badgeFrame` prop
2. `src/components/ui/badge-frame-svgs.tsx` — SVG definitions for Gold crown, Diamond sparkles, Fire flames
3. `src/app/api/profile/badge-frame/route.ts` — `POST { badgeFrame: string | null }` — validates ownership, updates `users.active_badge_frame`
4. `src/components/settings/badge-frame-picker.tsx` — Frame selector for settings page (shows owned frames)

### Modified Files
5. `src/lib/shop/items.ts` — Add 6 new upgrade items:
   - `badge_gold_svg` (100 tokens, requires `badge_gold`)
   - `badge_gold_animated` (150 tokens, requires `badge_gold_svg`)
   - `badge_diamond_svg` (100 tokens, requires `badge_diamond`)
   - `badge_diamond_animated` (150 tokens, requires `badge_diamond_svg`)
   - `badge_fire_svg` (100 tokens, requires `badge_fire`)
   - `badge_fire_animated` (150 tokens, requires `badge_fire_svg`)
6. `src/app/api/shop/purchase/route.ts` — Add upgrade prerequisite validation: check `requiresItemId` is owned before allowing purchase. Update apply-effects to handle SVG/animated badge IDs.
7. `src/components/layout/header.tsx` — Replace plain `<Avatar>` with `<FramedAvatar>` using `activeBadgeFrame` from profile store
8. `src/components/leaderboard/leaderboard-row.tsx` — Add small framed avatar next to display name (requires leaderboard API to return `active_badge_frame`)
9. `src/app/api/leaderboard/route.ts` — Add `active_badge_frame` to leaderboard select query
10. `src/types/index.ts` — Add `active_badge_frame?: string | null` to `LeaderboardEntry`
11. `src/components/trader/profile-header.tsx` — Use `<FramedAvatar>` for trader profile avatar
12. `src/app/api/trader/[id]/route.ts` — Add `active_badge_frame` to trader profile response
13. `src/types/trader.ts` — Add `active_badge_frame` to `PublicProfile`
14. `src/components/settings/appearance-section.tsx` — Import and render `BadgeFramePicker` (shared file with Agent 2)

---

## Migration

**File:** `supabase/migrations/013_theme_mode_column.sql`

No new migration needed — `active_theme` and `active_badge_frame` columns already exist from migration 011. The existing VARCHAR(50) columns accept any item ID string including the new SVG/animated tier IDs.

---

## File Ownership (minimized overlaps)

| File | A1 | A2 | A3 | Notes |
|------|----|----|----|----|
| `src/stores/profile-store.ts` | X | | | A1 adds all new fields (theme, badge, refetch) |
| `src/components/layout/profile-initializer.tsx` | X | | | A1 extends props |
| `src/app/(dashboard)/layout.tsx` | X | | | A1 extends DB query |
| `src/app/api/profile/balance/route.ts` | X | | | New |
| `src/app/(dashboard)/shop/page.tsx` | X | X | | A1 refetch, A2 apply callback — **sequence: A1 first** |
| `src/app/(dashboard)/rewards/page.tsx` | X | | | A1 only |
| `src/app/layout.tsx` | | X | | A2 adds ThemeProvider |
| `src/app/globals.css` | | X | | A2 adds theme CSS |
| `src/components/layout/theme-provider.tsx` | | X | | New |
| `src/components/settings/appearance-section.tsx` | | X | X | A2 creates, A3 adds badge picker — **sequence: A2 first** |
| `src/app/api/profile/theme/route.ts` | | X | | New |
| `src/app/(dashboard)/settings/page.tsx` | | X | | A2 adds appearance section |
| `src/components/shop/shop-item-card.tsx` | | X | | A2 adds Apply button |
| `src/types/shop.ts` | | X | | A2 adds requiresItemId |
| `src/app/api/shop/items/route.ts` | | X | | A2 returns active theme/badge |
| `src/components/ui/framed-avatar.tsx` | | | X | New |
| `src/components/ui/badge-frame-svgs.tsx` | | | X | New |
| `src/app/api/profile/badge-frame/route.ts` | | | X | New |
| `src/components/settings/badge-frame-picker.tsx` | | | X | New |
| `src/lib/shop/items.ts` | | | X | A3 adds upgrade items |
| `src/app/api/shop/purchase/route.ts` | | | X | A3 adds prerequisite validation |
| `src/components/layout/header.tsx` | | | X | A3 uses FramedAvatar |
| `src/components/leaderboard/leaderboard-row.tsx` | | | X | A3 uses FramedAvatar |
| `src/app/api/leaderboard/route.ts` | | | X | A3 adds badge_frame |
| `src/types/index.ts` | | | X | A3 adds badge_frame |
| `src/components/trader/profile-header.tsx` | | | X | A3 uses FramedAvatar |
| `src/app/api/trader/[id]/route.ts` | | | X | A3 adds badge_frame |
| `src/types/trader.ts` | | | X | A3 adds badge_frame |

### Execution Order
1. **Agent 1 runs first** (token sync) — modifies shared files (profile store, layout, initializer)
2. **Agent 2 and 3 run in parallel** after Agent 1 completes — Agent 2 handles themes, Agent 3 handles badge frames
3. Agent 3 appends badge frame picker to the appearance section created by Agent 2 — **sequence if overlap: A2 creates file first, A3 appends**

---

## Post-Agent Integration (sequential)

1. Verify `src/app/(dashboard)/shop/page.tsx` has both refetch (A1) and apply (A2) logic
2. Verify `src/components/settings/appearance-section.tsx` has both theme picker (A2) and badge frame picker (A3)
3. `npm run build` — 0 errors
4. `npm run lint` — 0 errors
5. `npx vitest run` — all tests pass
6. Manual test: claim reward → header updates instantly
7. Manual test: buy theme → apply from shop → UI changes
8. Manual test: toggle dark/light → theme persists
9. Manual test: buy badge → apply → avatar shows ring on header + leaderboard
10. Commit, push, deploy
