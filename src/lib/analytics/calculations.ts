import type { Trade, PortfolioSnapshot } from '@/types'
import type { TradeHighlight, TickerPnL, MonthlyReturn } from '@/types/analytics'

/**
 * Compute the average buy price (per share, in cents) for a ticker
 * from all buy trades up to and including the given index.
 */
function avgBuyCost(trades: Trade[], ticker: string, beforeIndex: number): number {
  let totalCents = 0
  let totalShares = 0
  for (let i = 0; i <= beforeIndex; i++) {
    const t = trades[i]
    if (t.ticker === ticker && t.type === 'buy') {
      totalCents += t.total_cents
      totalShares += t.shares
    }
  }
  if (totalShares === 0) return 0
  return totalCents / totalShares
}

/**
 * Compute win rate: percentage of sell trades that sold above avg buy cost.
 * Returns 0 if there are no sell trades.
 */
export function computeWinRate(trades: Trade[]): number {
  const sells = trades.filter((t) => t.type === 'sell')
  if (sells.length === 0) return 0

  let wins = 0
  for (const sell of sells) {
    const sellIndex = trades.indexOf(sell)
    const avg = avgBuyCost(trades, sell.ticker, sellIndex)
    if (avg > 0 && sell.price_cents > avg) {
      wins++
    }
  }

  return (wins / sells.length) * 100
}

/**
 * Find the best and worst sell trades by P&L percentage.
 */
export function computeBestWorstTrades(trades: Trade[]): {
  best: TradeHighlight | null
  worst: TradeHighlight | null
} {
  const sells = trades.filter((t) => t.type === 'sell')
  if (sells.length === 0) return { best: null, worst: null }

  let best: TradeHighlight | null = null
  let worst: TradeHighlight | null = null

  for (const sell of sells) {
    const sellIndex = trades.indexOf(sell)
    const avg = avgBuyCost(trades, sell.ticker, sellIndex)
    if (avg === 0) continue

    const pnlPerShare = sell.price_cents - avg
    const pnlCents = Math.round(pnlPerShare * sell.shares)
    const pnlPercent = (pnlPerShare / avg) * 100

    const highlight: TradeHighlight = {
      ticker: sell.ticker,
      type: 'sell',
      shares: sell.shares,
      price_cents: sell.price_cents,
      total_cents: sell.total_cents,
      pnl_cents: pnlCents,
      pnl_percent: pnlPercent,
      created_at: sell.created_at,
    }

    if (!best || pnlPercent > best.pnl_percent) best = highlight
    if (!worst || pnlPercent < worst.pnl_percent) worst = highlight
  }

  return { best, worst }
}

/**
 * Compute P&L grouped by ticker.
 * net_pnl = total_sell - total_buy (negative if still holding / losing).
 * Sorted by absolute net_pnl descending.
 */
export function computePnLByTicker(trades: Trade[]): TickerPnL[] {
  const map = new Map<string, { buyCents: number; sellCents: number; count: number }>()

  for (const t of trades) {
    const entry = map.get(t.ticker) ?? { buyCents: 0, sellCents: 0, count: 0 }
    if (t.type === 'buy') {
      entry.buyCents += t.total_cents
    } else {
      entry.sellCents += t.total_cents
    }
    entry.count++
    map.set(t.ticker, entry)
  }

  const results: TickerPnL[] = []
  for (const [ticker, entry] of map) {
    results.push({
      ticker,
      total_buy_cents: entry.buyCents,
      total_sell_cents: entry.sellCents,
      net_pnl_cents: entry.sellCents - entry.buyCents,
      trade_count: entry.count,
    })
  }

  results.sort((a, b) => Math.abs(b.net_pnl_cents) - Math.abs(a.net_pnl_cents))
  return results
}

/**
 * Compute monthly returns from portfolio snapshots.
 * Groups by YYYY-MM, takes first and last snapshot per month.
 */
export function computeMonthlyReturns(snapshots: PortfolioSnapshot[]): MonthlyReturn[] {
  if (snapshots.length === 0) return []

  const grouped = new Map<string, PortfolioSnapshot[]>()
  for (const s of snapshots) {
    const month = s.snapshot_date.slice(0, 7) // YYYY-MM
    const arr = grouped.get(month) ?? []
    arr.push(s)
    grouped.set(month, arr)
  }

  const results: MonthlyReturn[] = []
  for (const [month, snaps] of grouped) {
    const first = snaps[0]
    const last = snaps[snaps.length - 1]
    const startValue = first.total_value_cents
    const endValue = last.total_value_cents
    const returnPercent = startValue === 0 ? 0 : ((endValue - startValue) / startValue) * 100

    results.push({
      month,
      return_percent: returnPercent,
      start_value_cents: startValue,
      end_value_cents: endValue,
    })
  }

  results.sort((a, b) => a.month.localeCompare(b.month))
  return results
}

/**
 * Compute average gain % and average loss % from sell trades.
 */
export function computeAvgGainLoss(trades: Trade[]): {
  avgGain: number
  avgLoss: number
} {
  const sells = trades.filter((t) => t.type === 'sell')
  if (sells.length === 0) return { avgGain: 0, avgLoss: 0 }

  const gains: number[] = []
  const losses: number[] = []

  for (const sell of sells) {
    const sellIndex = trades.indexOf(sell)
    const avg = avgBuyCost(trades, sell.ticker, sellIndex)
    if (avg === 0) continue

    const pnlPercent = ((sell.price_cents - avg) / avg) * 100
    if (pnlPercent >= 0) {
      gains.push(pnlPercent)
    } else {
      losses.push(pnlPercent)
    }
  }

  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0

  return { avgGain, avgLoss }
}
