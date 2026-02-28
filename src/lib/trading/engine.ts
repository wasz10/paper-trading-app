import { createClient } from '@/lib/supabase/server'
import { validateBuy, validateSell, isDustPosition, calculateShares } from './validation'
import { calculateWeightedAvgCost } from './calculations'
import type { Trade } from '@/types'

export interface TradeResult {
  success: boolean
  trade?: Trade
  error?: string
}

function getTodayString(timezone: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: timezone })
}

export async function executeBuy(
  userId: string,
  ticker: string,
  dollarAmountCents: number,
  currentPriceCents: number
): Promise<TradeResult> {
  const supabase = await createClient()

  // Fetch user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('cash_balance, trades_today, trades_today_date, is_subscriber, timezone')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { success: false, error: 'User not found' }
  }

  // Reset trades_today if date changed
  const today = getTodayString(user.timezone)
  let tradesToday = user.trades_today
  if (user.trades_today_date !== today) {
    tradesToday = 0
  }

  // Calculate shares
  const shares = calculateShares(dollarAmountCents, currentPriceCents)
  const totalCents = Math.round(shares * currentPriceCents)

  // Validate
  const validation = validateBuy(user.cash_balance, totalCents, tradesToday, user.is_subscriber)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  // Optimistic lock: only update if balance hasn't changed (prevents double-spend)
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({
      cash_balance: user.cash_balance - totalCents,
      trades_today: tradesToday + 1,
      trades_today_date: today,
    })
    .eq('id', userId)
    .eq('cash_balance', user.cash_balance)
    .select('id')

  if (updateError || !updated || updated.length === 0) {
    return { success: false, error: 'Balance changed, please retry' }
  }

  // Upsert holding
  const { data: existingHolding } = await supabase
    .from('holdings')
    .select('id, shares, avg_cost_cents')
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .single()

  if (existingHolding) {
    const newAvgCost = calculateWeightedAvgCost(
      Number(existingHolding.shares),
      existingHolding.avg_cost_cents,
      shares,
      currentPriceCents
    )
    const { error: holdingErr } = await supabase
      .from('holdings')
      .update({
        shares: Number(existingHolding.shares) + shares,
        avg_cost_cents: newAvgCost,
      })
      .eq('id', existingHolding.id)

    if (holdingErr) {
      // Rollback balance
      await supabase
        .from('users')
        .update({ cash_balance: user.cash_balance })
        .eq('id', userId)
      return { success: false, error: 'Failed to update holding' }
    }
  } else {
    const { error: holdingErr } = await supabase.from('holdings').insert({
      user_id: userId,
      ticker,
      shares,
      avg_cost_cents: currentPriceCents,
    })

    if (holdingErr) {
      await supabase
        .from('users')
        .update({ cash_balance: user.cash_balance })
        .eq('id', userId)
      return { success: false, error: 'Failed to create holding' }
    }
  }

  // Insert trade
  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .insert({
      user_id: userId,
      ticker,
      type: 'buy' as const,
      shares,
      price_cents: currentPriceCents,
      total_cents: totalCents,
      order_type: 'market',
    })
    .select()
    .single()

  if (tradeError || !trade) {
    return { success: false, error: 'Failed to record trade' }
  }

  return { success: true, trade: { ...trade, order_type: 'market' as const } }
}

export async function executeSell(
  userId: string,
  ticker: string,
  sharesToSell: number,
  currentPriceCents: number
): Promise<TradeResult> {
  const supabase = await createClient()

  // Fetch user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('cash_balance, trades_today, trades_today_date, is_subscriber, timezone')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { success: false, error: 'User not found' }
  }

  // Fetch holding
  const { data: holding, error: holdingError } = await supabase
    .from('holdings')
    .select('id, shares, avg_cost_cents')
    .eq('user_id', userId)
    .eq('ticker', ticker)
    .single()

  if (holdingError || !holding) {
    return { success: false, error: `You don't own any ${ticker}` }
  }

  // Reset trades_today if date changed
  const today = getTodayString(user.timezone)
  let tradesToday = user.trades_today
  if (user.trades_today_date !== today) {
    tradesToday = 0
  }

  const ownedShares = Number(holding.shares)

  // Validate
  const validation = validateSell(ownedShares, sharesToSell)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  // Dust check — sell all if remaining is negligible
  let actualSharesToSell = sharesToSell
  const remaining = ownedShares - sharesToSell
  if (remaining > 0 && isDustPosition(remaining, currentPriceCents)) {
    actualSharesToSell = ownedShares
  }

  const totalCents = Math.round(actualSharesToSell * currentPriceCents)

  // Optimistic lock on balance
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({
      cash_balance: user.cash_balance + totalCents,
      trades_today: tradesToday + 1,
      trades_today_date: today,
    })
    .eq('id', userId)
    .eq('cash_balance', user.cash_balance)
    .select('id')

  if (updateError || !updated || updated.length === 0) {
    return { success: false, error: 'Balance changed, please retry' }
  }

  // Update or delete holding
  if (actualSharesToSell >= ownedShares) {
    const { error: holdingErr } = await supabase.from('holdings').delete().eq('id', holding.id)
    if (holdingErr) {
      await supabase.from('users').update({ cash_balance: user.cash_balance }).eq('id', userId)
      return { success: false, error: 'Failed to update holding' }
    }
  } else {
    const { error: holdingErr } = await supabase
      .from('holdings')
      .update({ shares: ownedShares - actualSharesToSell })
      .eq('id', holding.id)
    if (holdingErr) {
      await supabase.from('users').update({ cash_balance: user.cash_balance }).eq('id', userId)
      return { success: false, error: 'Failed to update holding' }
    }
  }

  // Insert trade
  const { data: trade, error: tradeError } = await supabase
    .from('trades')
    .insert({
      user_id: userId,
      ticker,
      type: 'sell' as const,
      shares: actualSharesToSell,
      price_cents: currentPriceCents,
      total_cents: totalCents,
      order_type: 'market',
    })
    .select()
    .single()

  if (tradeError || !trade) {
    return { success: false, error: 'Failed to record trade' }
  }

  return { success: true, trade: { ...trade, order_type: 'market' as const } }
}
