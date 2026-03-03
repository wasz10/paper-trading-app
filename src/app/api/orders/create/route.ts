import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDayOrderExpiry } from '@/lib/trading/order-engine'
import { checkAndAwardAchievements } from '@/lib/game/achievements'

const TICKER_REGEX = /^[A-Z0-9.\-]{1,10}$/
const VALID_ORDER_TYPES = ['limit_buy', 'limit_sell', 'stop_loss', 'trailing_stop'] as const
const FREE_ORDER_LIMIT = 5
const SUB_ORDER_LIMIT = 15

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticker, orderType, timeInForce, targetPriceCents, trailAmountCents, trailPercent, shares } = body

    // Validate ticker
    if (!ticker || !TICKER_REGEX.test(ticker)) {
      return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
    }

    // Validate order type
    if (!VALID_ORDER_TYPES.includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 })
    }

    // Validate shares
    if (!shares || typeof shares !== 'number' || shares <= 0 || !Number.isFinite(shares) || shares > 9999.999999) {
      return NextResponse.json({ error: 'Invalid shares' }, { status: 400 })
    }

    // Validate TIF
    const tif = timeInForce === 'day' ? 'day' : 'gtc'

    // Validate price fields based on order type
    if ((orderType === 'limit_buy' || orderType === 'limit_sell' || orderType === 'stop_loss') && (!targetPriceCents || typeof targetPriceCents !== 'number' || !Number.isFinite(targetPriceCents) || targetPriceCents <= 0 || targetPriceCents > 100_000_000)) {
      return NextResponse.json({ error: 'Target price required' }, { status: 400 })
    }
    if (orderType === 'trailing_stop' && !trailAmountCents && !trailPercent) {
      return NextResponse.json({ error: 'Trail amount or percent required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('cash_balance, reserved_cash, is_subscriber')
      .eq('id', user.id)
      .single()
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check pending order limit
    const { count: pendingCount } = await supabase
      .from('pending_orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'pending')

    const limit = profile.is_subscriber ? SUB_ORDER_LIMIT : FREE_ORDER_LIMIT
    if ((pendingCount ?? 0) >= limit) {
      return NextResponse.json({ error: `Maximum ${limit} pending orders` }, { status: 400 })
    }

    let reservedCashCents = 0

    // For buy orders: reserve cash
    if (orderType === 'limit_buy') {
      reservedCashCents = Math.round(shares * targetPriceCents)
      const availableCash = profile.cash_balance - profile.reserved_cash
      if (reservedCashCents > availableCash) {
        return NextResponse.json({ error: 'Insufficient available cash' }, { status: 400 })
      }

      // Lock cash
      const { error: lockErr } = await supabase
        .from('users')
        .update({ reserved_cash: profile.reserved_cash + reservedCashCents })
        .eq('id', user.id)
        .eq('reserved_cash', profile.reserved_cash)
      if (lockErr) {
        return NextResponse.json({ error: 'Failed to reserve cash' }, { status: 500 })
      }
    }

    // For sell/stop orders: verify shares and reserve
    if (orderType === 'limit_sell' || orderType === 'stop_loss' || orderType === 'trailing_stop') {
      const { data: holding } = await supabase
        .from('holdings')
        .select('id, shares, reserved_shares')
        .eq('user_id', user.id)
        .eq('ticker', ticker)
        .single()

      if (!holding) {
        return NextResponse.json({ error: `You don't own ${ticker}` }, { status: 400 })
      }

      const availableShares = Number(holding.shares) - Number(holding.reserved_shares)
      if (shares > availableShares) {
        return NextResponse.json({ error: 'Insufficient available shares' }, { status: 400 })
      }

      // Lock shares
      const { error: lockErr } = await supabase
        .from('holdings')
        .update({ reserved_shares: Number(holding.reserved_shares) + shares })
        .eq('id', holding.id)
        .eq('reserved_shares', holding.reserved_shares)
      if (lockErr) {
        return NextResponse.json({ error: 'Failed to reserve shares' }, { status: 500 })
      }
    }

    // Insert order
    const expiresAt = tif === 'day' ? getDayOrderExpiry() : null
    const { data: order, error: insertErr } = await supabase
      .from('pending_orders')
      .insert({
        user_id: user.id,
        ticker,
        order_type: orderType,
        time_in_force: tif,
        target_price_cents: targetPriceCents ?? null,
        trail_amount_cents: trailAmountCents ?? null,
        trail_percent: trailPercent ?? null,
        high_water_mark_cents: orderType === 'trailing_stop' ? targetPriceCents : null,
        shares,
        reserved_cash_cents: reservedCashCents,
        status: 'pending',
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (insertErr || !order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Fire-and-forget achievement check
    checkAndAwardAchievements(user.id).catch(() => {})

    return NextResponse.json({ data: order })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
