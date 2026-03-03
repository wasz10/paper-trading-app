import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuote } from '@/lib/market/yahoo'
import { evaluateOrder, updateHighWaterMark, isDayOrderExpired } from '@/lib/trading/order-engine'
import { calculateWeightedAvgCost } from '@/lib/trading/calculations'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Fetch user's pending orders
    const { data: orders } = await admin
      .from('pending_orders')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (!orders || orders.length === 0) {
      return NextResponse.json({ data: { filled: [], expired: [] } })
    }

    // Get unique tickers and batch-fetch quotes
    const tickers = [...new Set(orders.map((o) => o.ticker))]
    const quotes = new Map<string, number>()
    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const q = await getQuote(ticker)
          quotes.set(ticker, q.priceCents)
        } catch { /* skip failed quotes */ }
      })
    )

    const filled: string[] = []
    const expired: string[] = []

    for (const order of orders) {
      const currentPrice = quotes.get(order.ticker)
      if (!currentPrice) continue

      // Check expiry
      if (isDayOrderExpired(order)) {
        await expireOrder(admin, order)
        expired.push(order.id)
        continue
      }

      // Update high-water mark for trailing stops
      if (order.order_type === 'trailing_stop') {
        const newHwm = updateHighWaterMark(order, currentPrice)
        if (newHwm > (order.high_water_mark_cents ?? 0)) {
          await admin
            .from('pending_orders')
            .update({ high_water_mark_cents: newHwm })
            .eq('id', order.id)
          order.high_water_mark_cents = newHwm
        }
      }

      // Evaluate fill condition
      const result = evaluateOrder(order, currentPrice)
      if (result.shouldFill) {
        const success = await fillOrder(admin, order, result.fillPriceCents)
        if (success) filled.push(order.id)
      }
    }

    return NextResponse.json({ data: { filled, expired } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function fillOrder(
  admin: ReturnType<typeof createAdminClient>,
  order: Record<string, unknown>,
  fillPriceCents: number
): Promise<boolean> {
  const orderId = order.id as string
  const userId = order.user_id as string
  const ticker = order.ticker as string
  const orderType = order.order_type as string
  const shares = Number(order.shares)
  const reservedCashCents = Number(order.reserved_cash_cents ?? 0)

  const totalCents = Math.round(shares * fillPriceCents)

  if (orderType === 'limit_buy') {
    // Get user profile
    const { data: profile } = await admin.from('users').select('cash_balance, reserved_cash').eq('id', userId).single()
    if (!profile) return false

    // Release reserved cash, deduct actual cost
    const newCash = profile.cash_balance - totalCents + reservedCashCents
    const newReserved = Math.max(0, profile.reserved_cash - reservedCashCents)
    await admin.from('users').update({ cash_balance: newCash, reserved_cash: newReserved }).eq('id', userId)

    // Upsert holding
    const { data: holding } = await admin.from('holdings').select('id, shares, avg_cost_cents').eq('user_id', userId).eq('ticker', ticker).single()
    if (holding) {
      const newAvg = calculateWeightedAvgCost(Number(holding.shares), holding.avg_cost_cents, shares, fillPriceCents)
      await admin.from('holdings').update({ shares: Number(holding.shares) + shares, avg_cost_cents: newAvg }).eq('id', holding.id)
    } else {
      await admin.from('holdings').insert({ user_id: userId, ticker, shares, avg_cost_cents: fillPriceCents })
    }
  } else {
    // Sell-type order (limit_sell, stop_loss, trailing_stop)
    const { data: profile } = await admin.from('users').select('cash_balance').eq('id', userId).single()
    if (!profile) return false

    await admin.from('users').update({ cash_balance: profile.cash_balance + totalCents }).eq('id', userId)

    // Update holding
    const { data: holding } = await admin.from('holdings').select('id, shares, reserved_shares').eq('user_id', userId).eq('ticker', ticker).single()
    if (holding) {
      const remainingShares = Number(holding.shares) - shares
      const newReserved = Math.max(0, Number(holding.reserved_shares) - shares)
      if (remainingShares <= 0.000001) {
        await admin.from('holdings').delete().eq('id', holding.id)
      } else {
        await admin.from('holdings').update({ shares: remainingShares, reserved_shares: newReserved }).eq('id', holding.id)
      }
    }
  }

  // Record trade
  const tradeType = orderType === 'limit_buy' ? 'buy' : 'sell'
  const { data: trade } = await admin.from('trades').insert({
    user_id: userId,
    ticker,
    type: tradeType,
    shares,
    price_cents: fillPriceCents,
    total_cents: totalCents,
    order_type: orderType.startsWith('limit') ? 'limit' : 'stop',
  }).select('id').single()

  // Mark order as filled
  await admin.from('pending_orders').update({
    status: 'filled',
    filled_price_cents: fillPriceCents,
    filled_at: new Date().toISOString(),
    trade_id: trade?.id ?? null,
  }).eq('id', orderId)

  return true
}

async function expireOrder(
  admin: ReturnType<typeof createAdminClient>,
  order: Record<string, unknown>
): Promise<void> {
  const orderId = order.id as string
  const userId = order.user_id as string
  const orderType = order.order_type as string
  const ticker = order.ticker as string
  const shares = Number(order.shares)
  const reservedCashCents = Number(order.reserved_cash_cents ?? 0)

  // Release reservations
  if (orderType === 'limit_buy' && reservedCashCents > 0) {
    const { data: profile } = await admin.from('users').select('reserved_cash').eq('id', userId).single()
    if (profile) {
      await admin.from('users').update({ reserved_cash: Math.max(0, profile.reserved_cash - reservedCashCents) }).eq('id', userId)
    }
  }

  if (['limit_sell', 'stop_loss', 'trailing_stop'].includes(orderType)) {
    const { data: holding } = await admin.from('holdings').select('id, reserved_shares').eq('user_id', userId).eq('ticker', ticker).single()
    if (holding) {
      await admin.from('holdings').update({ reserved_shares: Math.max(0, Number(holding.reserved_shares) - shares) }).eq('id', holding.id)
    }
  }

  await admin.from('pending_orders').update({ status: 'expired' }).eq('id', orderId)
}
