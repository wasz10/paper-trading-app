import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuote } from '@/lib/market/yahoo'
import { getCached, setCache, CACHE_TTL } from '@/lib/market/cache'
import { checkRateLimit } from '@/lib/rate-limit'
import {
  calculateReturnPercent,
  calculatePeriodReturnPercent,
  calculatePortfolioValue,
  getDisplayName,
  getPeriodSnapshotDate,
} from '@/lib/leaderboard/calculations'
import type { LeaderboardPeriod } from '@/lib/leaderboard/calculations'
import type { LeaderboardEntry, StockQuote } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const periodParam = searchParams.get('period') ?? 'all-time'
    const validPeriods: LeaderboardPeriod[] = ['daily', 'weekly', 'all-time']
    if (!validPeriods.includes(periodParam as LeaderboardPeriod)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 })
    }
    const period = periodParam as LeaderboardPeriod

    const supabase = await createClient()

    // Auth check — leaderboard requires login
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit: 10 requests per minute per user
    const { allowed, retryAfterMs } = checkRateLimit(user.id, 10, 60_000)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
        }
      )
    }

    // Use admin client for cross-user reads (RLS restricts to own rows only)
    const admin = createAdminClient()

    // Fetch all users
    const { data: users, error: usersError } = await admin
      .from('users')
      .select('id, display_name, cash_balance, is_subscriber, show_display_name')

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Fetch all holdings
    const { data: holdings, error: holdingsError } = await admin
      .from('holdings')
      .select('user_id, ticker, shares')

    if (holdingsError) {
      return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 })
    }

    // Collect unique tickers across all holdings
    const uniqueTickers = [...new Set((holdings ?? []).map((h) => h.ticker))]

    // Batch-fetch current prices with caching (reuses existing 60s quote cache)
    const priceMap = new Map<string, number>()

    if (uniqueTickers.length > 0) {
      const quoteResults = await Promise.allSettled(
        uniqueTickers.map(async (ticker) => {
          const cacheKey = `quote:${ticker}`
          const cached = getCached<StockQuote>(cacheKey)
          if (cached) return cached
          const quote = await getQuote(ticker)
          setCache(cacheKey, quote, CACHE_TTL.QUOTE)
          return quote
        })
      )

      quoteResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          priceMap.set(uniqueTickers[i], result.value.priceCents)
        }
      })
    }

    // Group holdings by user_id
    const holdingsByUser = new Map<string, Array<{ shares: number; currentPriceCents: number }>>()
    for (const h of holdings ?? []) {
      const currentPriceCents = priceMap.get(h.ticker) ?? 0
      const userHoldings = holdingsByUser.get(h.user_id) ?? []
      userHoldings.push({ shares: h.shares, currentPriceCents })
      holdingsByUser.set(h.user_id, userHoldings)
    }

    // Fetch baseline snapshots for period-based calculations
    const snapshotDate = getPeriodSnapshotDate(period)
    const snapshotMap = new Map<string, number>()

    if (snapshotDate) {
      const { data: snapshots } = await admin
        .from('portfolio_snapshots')
        .select('user_id, total_value_cents')
        .lte('snapshot_date', snapshotDate)
        .order('snapshot_date', { ascending: false })

      if (snapshots) {
        for (const snap of snapshots) {
          if (!snapshotMap.has(snap.user_id)) {
            snapshotMap.set(snap.user_id, Number(snap.total_value_cents))
          }
        }
      }
    }

    // Calculate leaderboard entries — user_id stays server-side only
    const entries: LeaderboardEntry[] = users.map((u) => {
      const userHoldings = holdingsByUser.get(u.id) ?? []
      const totalValue = calculatePortfolioValue(u.cash_balance, userHoldings)

      const returnPct = snapshotDate
        ? calculatePeriodReturnPercent(totalValue, snapshotMap.get(u.id) ?? null)
        : calculateReturnPercent(totalValue)

      return {
        user_id: u.show_display_name ? u.id : null,
        display_name: getDisplayName(u.id, u.display_name, u.show_display_name),
        total_return_pct: Math.round(returnPct * 100) / 100,
        is_subscriber: u.is_subscriber,
        is_current_user: u.id === user.id,
      }
    })

    // Sort all entries to compute accurate rank before slicing
    const allSorted = [...entries].sort((a, b) => b.total_return_pct - a.total_return_pct)
    const currentUserRank = allSorted.findIndex((e) => e.is_current_user) + 1
    const currentUserEntry = allSorted.find((e) => e.is_current_user) ?? null

    const ranked = allSorted.slice(0, 50)

    return NextResponse.json({
      data: ranked,
      currentUser: currentUserEntry ? { entry: currentUserEntry, rank: currentUserRank } : null,
      totalTraders: allSorted.length,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
