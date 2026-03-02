import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuote } from '@/lib/market/yahoo'
import {
  calculateReturnPercent,
  calculatePeriodReturnPercent,
  calculatePortfolioValue,
  getDisplayName,
  getPeriodSnapshotDate,
  rankEntries,
} from '@/lib/leaderboard/calculations'
import type { LeaderboardPeriod } from '@/lib/leaderboard/calculations'
import type { LeaderboardEntry } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const period = (searchParams.get('period') ?? 'all-time') as LeaderboardPeriod

    const supabase = await createClient()

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, display_name, cash_balance, is_subscriber, show_display_name, created_at')

    if (usersError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Fetch all holdings
    const { data: holdings, error: holdingsError } = await supabase
      .from('holdings')
      .select('user_id, ticker, shares')

    if (holdingsError) {
      return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 })
    }

    // Collect unique tickers across all holdings
    const uniqueTickers = [...new Set((holdings ?? []).map((h) => h.ticker))]

    // Batch-fetch current prices for all unique tickers
    const priceMap = new Map<string, number>()

    if (uniqueTickers.length > 0) {
      const quoteResults = await Promise.allSettled(
        uniqueTickers.map((ticker) => getQuote(ticker))
      )

      quoteResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          priceMap.set(uniqueTickers[i], result.value.priceCents)
        }
        // If a quote fails, that ticker's holdings will be valued at 0
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
      const adminClient = createAdminClient()
      // Get the most recent snapshot on or before the target date for each user
      const { data: snapshots } = await adminClient
        .from('portfolio_snapshots')
        .select('user_id, total_value_cents')
        .lte('snapshot_date', snapshotDate)
        .order('snapshot_date', { ascending: false })

      // Take only the first (most recent) snapshot per user
      if (snapshots) {
        for (const snap of snapshots) {
          if (!snapshotMap.has(snap.user_id)) {
            snapshotMap.set(snap.user_id, Number(snap.total_value_cents))
          }
        }
      }
    }

    // Calculate leaderboard entries
    const entries: LeaderboardEntry[] = users.map((user) => {
      const userHoldings = holdingsByUser.get(user.id) ?? []
      const totalValue = calculatePortfolioValue(user.cash_balance, userHoldings)

      const returnPct = snapshotDate
        ? calculatePeriodReturnPercent(totalValue, snapshotMap.get(user.id) ?? null)
        : calculateReturnPercent(totalValue)

      return {
        user_id: user.id,
        display_name: getDisplayName(user.id, user.display_name, user.show_display_name),
        total_return_pct: Math.round(returnPct * 100) / 100,
        is_subscriber: user.is_subscriber,
        show_display_name: user.show_display_name,
        updated_at: new Date().toISOString(),
      }
    })

    const ranked = rankEntries(entries, 50)

    return NextResponse.json({ data: ranked })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
