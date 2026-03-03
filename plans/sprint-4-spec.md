# Sprint 4 Spec — Token Sync, Themes, Badge Frames

## Overview

Three interconnected features:

1. **Token balance sync** — Fix header showing stale token count vs shop/rewards pages
2. **Theme system** — Full color scheme themes with light/dark mode support
3. **Badge frame system** — Tiered upgradable badge frames on all avatars

---

## Feature 1: Token Balance Sync

### Problem
The header reads `tokenBalance` from a Zustand store initialized once on page load. Shop and rewards pages fetch fresh values from the DB. After claiming rewards or purchasing items, the header drifts out of sync.

### Root Cause
- `/api/rewards/claim` returns only `tokensEarned`, not the actual new balance
- `/api/challenges/claim` returns only `tokensEarned`, not the actual new balance
- `addTokens(delta)` in Zustand calculates optimistically instead of using the real DB value
- No mechanism to refetch the authoritative balance after token-changing operations

### Solution
Add a lightweight balance refetch endpoint and call it after every token-changing action:

1. **New API**: `GET /api/profile/balance` — returns `{ tokenBalance, cashBalance }` from DB
2. **New store method**: `profileStore.refetchBalance()` — fetches the endpoint and updates the store
3. **Call `refetchBalance()`** after: reward claims, challenge claims, shop purchases
4. **Remove `addTokens()` calls** from pages that already get the balance from their own API — rely on `refetchBalance()` instead

### Affected Pages
- Rewards page (`/rewards`) — after daily claim and challenge claim
- Shop page (`/shop`) — after purchase
- Header — automatically updated via Zustand subscription (no changes needed)

---

## Feature 2: Theme System

### Theme Inventory

| Theme | Price | Type | Description |
|-------|-------|------|-------------|
| Classic | Free | Built-in | Current default colors (available in dark + light) |
| Midnight Blue | 100 tokens | Purchasable | Deep blue palette (available in dark + light) |
| Sunset Orange | 100 tokens | Purchasable | Warm orange/amber palette (available in dark + light) |
| Forest Green | 100 tokens | Purchasable | Natural green palette (available in dark + light) |

### How Themes Work

**Two independent axes:**
- **Color theme** — Classic, Midnight, Sunset, Forest (stored as `active_theme` in DB)
- **Mode** — Dark or Light (managed by `next-themes`, stored in localStorage)

Users pick a color theme AND independently toggle dark/light mode.

### Color Scheme Design

Each theme defines a full set of CSS custom properties for both dark and light modes. Properties affected:

| Property | What it controls |
|----------|-----------------|
| `--background` | Page background |
| `--card` | Card surfaces |
| `--primary` | Buttons, links, active states |
| `--primary-foreground` | Text on primary backgrounds |
| `--accent` | Hover states, subtle highlights |
| `--border` | Borders and dividers |
| `--muted` | Muted backgrounds |
| `--muted-foreground` | Secondary text |
| `--ring` | Focus rings |

The existing dark theme CSS variables in `globals.css` become the "Classic Dark" defaults. New light-mode variables become "Classic Light". Each purchased theme adds its own set for both modes.

### Theme Application Flow

1. On login/page load, `active_theme` is fetched from DB and set as a `data-theme` attribute on `<html>`
2. `next-themes` manages the `dark`/`light` class on `<html>`
3. CSS selectors: `[data-theme="midnight"].dark { ... }`, `[data-theme="midnight"]:not(.dark) { ... }`
4. Default (no `data-theme` attribute) uses Classic theme

### Where Users Apply Themes

**Shop page** — Owned theme items show an "Apply" / "Applied" button instead of "Owned"
**Settings page** — New "Appearance" section with:
- Theme picker showing owned themes as selectable cards
- Dark/Light mode toggle

### Database
- `users.active_theme` column already exists (VARCHAR(50), from migration 011)
- Valid values: `NULL` (Classic), `'midnight'`, `'sunset'`, `'forest'`

### API
- `POST /api/profile/theme` — set active theme (validates ownership for non-free themes)
- `POST /api/profile/mode` — not needed, `next-themes` handles this client-side via localStorage

---

## Feature 3: Badge Frame System

### Frame Inventory

Each badge has 3 tiers. Users must own the previous tier to upgrade.

| Frame | Tier | Price | Visual | Requires |
|-------|------|-------|--------|----------|
| Gold Ring | 1 (Base) | 150 tokens | Gold colored ring around avatar | — |
| Gold SVG | 2 (Upgrade) | 100 tokens | Gold crown/laurel SVG overlay | Gold Ring |
| Gold Animated | 3 (Upgrade) | 150 tokens | Gold animated shimmer effect | Gold SVG |
| Diamond Ring | 1 (Base) | 250 tokens | Cyan/white colored ring | — |
| Diamond SVG | 2 (Upgrade) | 100 tokens | Diamond sparkle SVG overlay | Diamond Ring |
| Diamond Animated | 3 (Upgrade) | 150 tokens | Diamond animated sparkle effect | Diamond SVG |
| Fire Ring | 1 (Base) | 200 tokens | Red/orange colored ring | — |
| Fire SVG | 2 (Upgrade) | 100 tokens | Flame SVG overlay | Fire Ring |
| Fire Animated | 3 (Upgrade) | 150 tokens | Fire animated pulse/flicker | Fire SVG |

Total: 9 badge frame items (3 existing base items + 6 new upgrade items)

### Shop Item IDs

- Existing: `badge_gold`, `badge_diamond`, `badge_fire` (base ring tier)
- New: `badge_gold_svg`, `badge_diamond_svg`, `badge_fire_svg`
- New: `badge_gold_animated`, `badge_diamond_animated`, `badge_fire_animated`

### Visual Design

**Ring tier (CSS only):**
- Gold: `ring-2 ring-yellow-500`
- Diamond: `ring-2 ring-cyan-300`
- Fire: `ring-2 ring-orange-500`

**SVG tier (overlay):**
- Gold: Small crown/laurel wreath positioned at avatar top
- Diamond: Corner sparkle decorations
- Fire: Subtle flame wisps at avatar bottom

**Animated tier (CSS animation on SVG):**
- Gold: Gentle shimmer/pulse on the crown
- Diamond: Rotating sparkle particles
- Fire: Flickering flame animation

### Where Frames Display

All avatar locations:
- **Header** (32px avatar) — ring + scaled SVG
- **Leaderboard rows** — ring + SVG
- **Trader profile page** — larger avatar, ring + SVG

### Upgrade Logic

Purchase API validates:
- SVG tier requires owning the corresponding base ring
- Animated tier requires owning the corresponding SVG tier
- Error message: "You need {prerequisite item name} before upgrading"

### Where Users Apply Frames

**Shop page** — Owned frame items show "Apply" / "Applied" button
**Settings page** — Badge frame picker in the Appearance section (shows owned frames)

### Database
- `users.active_badge_frame` column already exists (VARCHAR(50), from migration 011)
- Valid values: `NULL`, `'badge_gold'`, `'badge_gold_svg'`, `'badge_gold_animated'`, etc.
- No migration needed — column accepts any frame item ID

### API
- `POST /api/profile/badge-frame` — set active badge frame (validates ownership)

---

## Shared: Appearance API & Store

### Profile Store Changes

```
profileStore:
  tokenBalance: number
  displayName: string
  activeTheme: string | null       // NEW
  activeBadgeFrame: string | null  // NEW
  preferredMode: 'dark' | 'light'  // managed by next-themes, not stored in DB

  refetchBalance()    // NEW — fetches GET /api/profile/balance
  setActiveTheme()    // NEW — calls POST /api/profile/theme + updates store
  setActiveBadgeFrame() // NEW — calls POST /api/profile/badge-frame + updates store
```

### Dashboard Layout Changes

Fetch `active_theme` and `active_badge_frame` alongside existing `display_name` and `token_balance` in the server layout, pass to `ProfileInitializer`.

---

## Out of Scope
- Theme marketplace (user-created themes)
- Badge frame trading between users
- Animated theme transitions
- Theme previews before purchase
