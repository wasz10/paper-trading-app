import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuote } from '@/lib/market/yahoo'

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret — fail closed if not configured
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('CRON_SECRET is not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Fetch all users with their cash balances
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, cash_balance')

  if (usersError || !users) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }

  // Fetch all holdings
  const { data: holdings, error: holdingsError } = await supabase
    .from('holdings')
    .select('user_id, ticker, shares')

  if (holdingsError || !holdings) {
    return NextResponse.json({ error: 'Failed to fetch holdings' }, { status: 500 })
  }

  // Collect unique tickers and batch-fetch prices
  const uniqueTickers = [...new Set(holdings.map((h) => h.ticker))]
  const priceMap = new Map<string, number>()

  if (uniqueTickers.length > 0) {
    const quoteResults = await Promise.allSettled(
      uniqueTickers.map((ticker) => getQuote(ticker))
    )
    quoteResults.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        priceMap.set(uniqueTickers[i], result.value.priceCents)
      }
    })
  }

  // Group holdings by user
  const holdingsByUser = new Map<string, Array<{ shares: number; priceCents: number }>>()
  for (const h of holdings) {
    const priceCents = priceMap.get(h.ticker) ?? 0
    const userHoldings = holdingsByUser.get(h.user_id) ?? []
    userHoldings.push({ shares: Number(h.shares), priceCents })
    holdingsByUser.set(h.user_id, userHoldings)
  }

  // Build all snapshots in memory, then batch upsert
  const snapshots = users.map((user) => {
    const userHoldings = holdingsByUser.get(user.id) ?? []
    const holdingsValueCents = userHoldings.reduce(
      (sum, h) => sum + Math.round(h.shares * h.priceCents),
      0
    )
    return {
      user_id: user.id,
      total_value_cents: user.cash_balance + holdingsValueCents,
      cash_cents: user.cash_balance,
      holdings_value_cents: holdingsValueCents,
      snapshot_date: today,
    }
  })

  const { error: upsertError } = await supabase
    .from('portfolio_snapshots')
    .upsert(snapshots, { onConflict: 'user_id,snapshot_date' })

  if (upsertError) {
    console.error('Bulk snapshot upsert failed:', upsertError)
    return NextResponse.json({ error: 'Snapshot upsert failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    date: today,
    users: users.length,
    snapshots: snapshots.length,
  })
}
