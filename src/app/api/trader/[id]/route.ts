import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuote } from '@/lib/market/yahoo'
import { getCached, setCache, CACHE_TTL } from '@/lib/market/cache'
import type { PublicProfile } from '@/types/trader'
import type { StockQuote } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Auth check — viewer must be logged in
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Fetch trader profile
    const { data: trader, error: traderError } = await admin
      .from('users')
      .select('id, display_name, is_subscriber, show_display_name, current_streak, cash_balance, created_at, active_badge_frame')
      .eq('id', id)
      .single()

    if (traderError || !trader) {
      return NextResponse.json({ error: 'Trader not found' }, { status: 404 })
    }

    // Privacy check: if show_display_name is false, return 404
    if (!trader.show_display_name) {
      return NextResponse.json({ error: 'Trader not found' }, { status: 404 })
    }

    // Fetch trade count, achievements, and holdings in parallel
    const [tradesResult, achievementsResult, holdingsResult] = await Promise.all([
      admin
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id),
      admin
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', id),
      admin
        .from('holdings')
        .select('ticker, shares')
        .eq('user_id', id),
    ])

    const tradeCount = tradesResult.count ?? 0
    const achievementIds = (achievementsResult.data ?? []).map((a) => a.achievement_id)
    const holdings = holdingsResult.data ?? []

    // Batch-fetch current prices for holdings
    const uniqueTickers = [...new Set(holdings.map((h) => h.ticker))]
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

    // Calculate total portfolio value
    const holdingsValue = holdings.reduce((sum, h) => {
      const priceCents = priceMap.get(h.ticker) ?? 0
      return sum + Math.round(h.shares * priceCents)
    }, 0)
    const totalValue = trader.cash_balance + holdingsValue

    // Compute return %: ((totalValue - 1000000) / 1000000) * 100
    const totalReturnPct = Math.round(((totalValue - 1000000) / 1000000) * 100 * 100) / 100

    const profile: PublicProfile = {
      id: trader.id,
      display_name: trader.display_name ?? `Trader #${trader.id.slice(-4).toUpperCase()}`,
      is_subscriber: trader.is_subscriber,
      created_at: trader.created_at,
      current_streak: trader.current_streak,
      total_return_pct: totalReturnPct,
      trade_count: tradeCount,
      achievement_ids: achievementIds,
      active_badge_frame: trader.active_badge_frame,
    }

    return NextResponse.json({ data: profile })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
