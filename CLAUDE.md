# paper-trading-app — AI-Powered Stock Market Simulator

## What This Is
A gamified stock market simulation platform where users trade with fake money using real market data. Mobile-first, aimed at teens and young adults who want to learn investing without risking capital.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Market Data:** Yahoo Finance API (via yahoo-finance2 npm package) — free, no API key needed
- **AI Features:** Anthropic Claude API (claude-sonnet-4-5-20250929) for trade analysis/coaching
- **State Management:** Zustand
- **Charts:** Lightweight Charts (TradingView open-source) for stock charts, Recharts for portfolio
- **Deployment:** Vercel

## Project Structure
```
paper-trading-app/
├── CLAUDE.md
├── SPEC.md
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login, signup, onboarding
│   │   ├── (dashboard)/        # Main app (portfolio, trade, explore)
│   │   ├── api/                # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui base components
│   │   ├── trade/              # Trading-specific components
│   │   ├── portfolio/          # Portfolio display components
│   │   ├── rewards/            # Dailies, streaks, tokens
│   │   └── ai/                 # AI coach/advisor components
│   ├── lib/
│   │   ├── supabase/           # Supabase client, types, queries
│   │   ├── market/             # Market data fetching & caching
│   │   ├── ai/                 # Anthropic API integration
│   │   ├── game/               # Game logic (rewards, limits, tokens)
│   │   └── utils.ts
│   ├── stores/                 # Zustand stores
│   └── types/                  # Shared TypeScript types
├── supabase/
│   └── migrations/             # Database migrations
└── public/
```

## Code Style
- Use ES modules (import/export), never CommonJS
- Functional components with hooks, no class components
- Prefer named exports for components, default export only for pages
- Use `cn()` utility from lib/utils for conditional classNames
- All API routes return typed responses using shared types from `src/types/`
- Prefer server components; mark client components with 'use client' only when needed
- Use Supabase Row Level Security (RLS) for all database access

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx supabase db push` — push migrations
- `npx supabase gen types typescript --local > src/lib/supabase/types.ts` — generate DB types

## Key Conventions
- Mobile-first responsive design (min-width breakpoints: sm, md, lg)
- All monetary values stored as integers (cents) in the database
- Shares stored as decimal (precision 10, scale 6) to support fractional shares
- Stock prices cached for 1 minute to avoid API rate limits
- User's simulated cash balance starts at $10,000
- Maximum 2 trades per day for free users, 6 for subscribers
- AI analysis calls should be non-blocking (fire and forget, show when ready)
- Use optimistic UI updates for trade execution

## Testing
- Vitest for unit tests
- Test files co-located: `Component.test.tsx` next to `Component.tsx`
- Run single test: `npx vitest run src/path/to/file.test.tsx`

## Git Workflow
- Create a feature branch for each task
- Commit frequently with conventional commit messages (feat:, fix:, chore:)
- Never commit directly to main
