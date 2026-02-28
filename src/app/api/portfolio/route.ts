import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateProfitLoss, calculatePortfolioValue } from '@/lib/trading/calculations'
import { getQuote } from '@/lib/market/yahoo'
import type { HoldingWithQuote, PortfolioSummary } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('cash_balance')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: holdings } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', user.id)

    const holdingsArr = holdings ?? []

    // Batch fetch prices using our wrapper
    const priceResults = await Promise.allSettled(
      holdingsArr.map((h) => getQuote(h.ticker))
    )

    const holdingsWithQuotes: HoldingWithQuote[] = holdingsArr.map((h, i) => {
      const priceResult = priceResults[i]
      let currentPriceCents = h.avg_cost_cents
      if (priceResult.status === 'fulfilled') {
        currentPriceCents = priceResult.value.priceCents
      }

      const shares = Number(h.shares)
      const currentValue = Math.round(shares * currentPriceCents)
      const { plCents, plPercent } = calculateProfitLoss(shares, h.avg_cost_cents, currentPriceCents)

      return {
        ...h,
        shares,
        currentPrice: currentPriceCents,
        currentValue,
        profitLoss: plCents,
        profitLossPercent: plPercent,
      }
    })

    const holdingsValue = holdingsWithQuotes.reduce((sum, h) => sum + h.currentValue, 0)
    const totalValue = calculatePortfolioValue(
      profile.cash_balance,
      holdingsWithQuotes.map((h) => ({
        shares: h.shares,
        currentPriceCents: h.currentPrice,
      }))
    )

    const initialBalance = 1000000
    const totalPL = totalValue - initialBalance
    const totalPLPercent = ((totalValue - initialBalance) / initialBalance) * 100

    const summary: PortfolioSummary = {
      totalValue,
      cashBalance: profile.cash_balance,
      holdingsValue,
      dailyPL: 0,
      totalPL,
      totalPLPercent,
      holdings: holdingsWithQuotes,
    }

    return NextResponse.json({ data: summary })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 })
  }
}
