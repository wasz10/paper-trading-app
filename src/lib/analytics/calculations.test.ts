import { describe, it, expect } from 'vitest'
import type { Trade, PortfolioSnapshot } from '@/types'
import {
  computeWinRate,
  computeBestWorstTrades,
  computePnLByTicker,
  computeMonthlyReturns,
  computeAvgGainLoss,
} from './calculations'

// ── Helpers ──────────────────────────────────────────────────────────

function makeTrade(overrides: Partial<Trade> & Pick<Trade, 'ticker' | 'type' | 'shares' | 'price_cents'>): Trade {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    total_cents: overrides.shares * overrides.price_cents,
    order_type: 'market',
    ai_analysis: null,
    created_at: overrides.created_at ?? new Date().toISOString(),
    ...overrides,
  }
}

function makeSnapshot(overrides: Partial<PortfolioSnapshot> & Pick<PortfolioSnapshot, 'total_value_cents' | 'snapshot_date'>): PortfolioSnapshot {
  return {
    id: crypto.randomUUID(),
    user_id: 'user-1',
    cash_cents: 0,
    holdings_value_cents: overrides.total_value_cents,
    created_at: overrides.created_at ?? new Date().toISOString(),
    ...overrides,
  }
}

// ── computeWinRate ───────────────────────────────────────────────────

describe('computeWinRate', () => {
  it('returns 0 for no trades', () => {
    expect(computeWinRate([])).toBe(0)
  })

  it('returns 0 for only buy trades', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000 }),
    ]
    expect(computeWinRate(trades)).toBe(0)
  })

  it('returns 100 when all sells are wins', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000, created_at: '2025-01-01T00:00:00Z' }),
      makeTrade({ ticker: 'AAPL', type: 'sell', shares: 5, price_cents: 16000, created_at: '2025-01-02T00:00:00Z' }),
    ]
    expect(computeWinRate(trades)).toBe(100)
  })

  it('calculates correct rate with mixed wins/losses', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000, created_at: '2025-01-01T00:00:00Z' }),
      makeTrade({ ticker: 'GOOG', type: 'buy', shares: 5, price_cents: 28000, created_at: '2025-01-02T00:00:00Z' }),
      // AAPL sell at profit
      makeTrade({ ticker: 'AAPL', type: 'sell', shares: 10, price_cents: 16000, created_at: '2025-01-03T00:00:00Z' }),
      // GOOG sell at loss
      makeTrade({ ticker: 'GOOG', type: 'sell', shares: 5, price_cents: 27000, created_at: '2025-01-04T00:00:00Z' }),
    ]
    // 1 win out of 2 sells = 50%
    expect(computeWinRate(trades)).toBe(50)
  })
})

// ── computeBestWorstTrades ───────────────────────────────────────────

describe('computeBestWorstTrades', () => {
  it('returns nulls for no sells', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000 }),
    ]
    const { best, worst } = computeBestWorstTrades(trades)
    expect(best).toBeNull()
    expect(worst).toBeNull()
  })

  it('returns nulls for empty trades', () => {
    const { best, worst } = computeBestWorstTrades([])
    expect(best).toBeNull()
    expect(worst).toBeNull()
  })

  it('handles single sell', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000, created_at: '2025-01-01T00:00:00Z' }),
      makeTrade({ ticker: 'AAPL', type: 'sell', shares: 10, price_cents: 16500, created_at: '2025-01-02T00:00:00Z' }),
    ]
    const { best, worst } = computeBestWorstTrades(trades)
    expect(best).not.toBeNull()
    expect(best!.ticker).toBe('AAPL')
    expect(best!.pnl_percent).toBeCloseTo(10, 1) // 16500/15000 - 1 = 10%
    // Single trade is both best and worst
    expect(worst).not.toBeNull()
    expect(worst!.ticker).toBe('AAPL')
  })

  it('identifies best and worst from multiple sells', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000, created_at: '2025-01-01T00:00:00Z' }),
      makeTrade({ ticker: 'GOOG', type: 'buy', shares: 5, price_cents: 28000, created_at: '2025-01-02T00:00:00Z' }),
      makeTrade({ ticker: 'TSLA', type: 'buy', shares: 8, price_cents: 20000, created_at: '2025-01-03T00:00:00Z' }),
      // AAPL +10%
      makeTrade({ ticker: 'AAPL', type: 'sell', shares: 10, price_cents: 16500, created_at: '2025-01-04T00:00:00Z' }),
      // GOOG -10.71%
      makeTrade({ ticker: 'GOOG', type: 'sell', shares: 5, price_cents: 25000, created_at: '2025-01-05T00:00:00Z' }),
      // TSLA +25%
      makeTrade({ ticker: 'TSLA', type: 'sell', shares: 8, price_cents: 25000, created_at: '2025-01-06T00:00:00Z' }),
    ]
    const { best, worst } = computeBestWorstTrades(trades)
    expect(best!.ticker).toBe('TSLA')
    expect(best!.pnl_percent).toBeCloseTo(25, 1)
    expect(worst!.ticker).toBe('GOOG')
    expect(worst!.pnl_percent).toBeCloseTo(-10.71, 1)
  })
})

// ── computePnLByTicker ──────────────────────────────────────────────

describe('computePnLByTicker', () => {
  it('returns empty for no trades', () => {
    expect(computePnLByTicker([])).toEqual([])
  })

  it('computes for single ticker', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000 }),
      makeTrade({ ticker: 'AAPL', type: 'sell', shares: 10, price_cents: 16000 }),
    ]
    const result = computePnLByTicker(trades)
    expect(result).toHaveLength(1)
    expect(result[0].ticker).toBe('AAPL')
    expect(result[0].total_buy_cents).toBe(150000)
    expect(result[0].total_sell_cents).toBe(160000)
    expect(result[0].net_pnl_cents).toBe(10000) // $100 profit
    expect(result[0].trade_count).toBe(2)
  })

  it('sorts by absolute net P&L descending', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000 }),
      makeTrade({ ticker: 'AAPL', type: 'sell', shares: 10, price_cents: 16000 }),
      makeTrade({ ticker: 'GOOG', type: 'buy', shares: 5, price_cents: 28000 }),
      makeTrade({ ticker: 'GOOG', type: 'sell', shares: 5, price_cents: 25000 }),
    ]
    const result = computePnLByTicker(trades)
    expect(result).toHaveLength(2)
    // GOOG has -$150 loss (abs 15000), AAPL has +$100 profit (abs 10000)
    expect(result[0].ticker).toBe('GOOG')
    expect(result[0].net_pnl_cents).toBe(-15000)
    expect(result[1].ticker).toBe('AAPL')
    expect(result[1].net_pnl_cents).toBe(10000)
  })
})

// ── computeMonthlyReturns ───────────────────────────────────────────

describe('computeMonthlyReturns', () => {
  it('returns empty for no snapshots', () => {
    expect(computeMonthlyReturns([])).toEqual([])
  })

  it('handles single month', () => {
    const snapshots: PortfolioSnapshot[] = [
      makeSnapshot({ total_value_cents: 1000000, snapshot_date: '2025-01-01' }),
      makeSnapshot({ total_value_cents: 1050000, snapshot_date: '2025-01-15' }),
      makeSnapshot({ total_value_cents: 1100000, snapshot_date: '2025-01-31' }),
    ]
    const result = computeMonthlyReturns(snapshots)
    expect(result).toHaveLength(1)
    expect(result[0].month).toBe('2025-01')
    expect(result[0].start_value_cents).toBe(1000000)
    expect(result[0].end_value_cents).toBe(1100000)
    expect(result[0].return_percent).toBeCloseTo(10, 1)
  })

  it('handles multiple months sorted chronologically', () => {
    const snapshots: PortfolioSnapshot[] = [
      makeSnapshot({ total_value_cents: 1000000, snapshot_date: '2025-01-01' }),
      makeSnapshot({ total_value_cents: 1100000, snapshot_date: '2025-01-31' }),
      makeSnapshot({ total_value_cents: 1100000, snapshot_date: '2025-02-01' }),
      makeSnapshot({ total_value_cents: 1050000, snapshot_date: '2025-02-28' }),
    ]
    const result = computeMonthlyReturns(snapshots)
    expect(result).toHaveLength(2)
    expect(result[0].month).toBe('2025-01')
    expect(result[0].return_percent).toBeCloseTo(10, 1)
    expect(result[1].month).toBe('2025-02')
    expect(result[1].return_percent).toBeCloseTo(-4.545, 1) // (1050000-1100000)/1100000
  })
})

// ── computeAvgGainLoss ──────────────────────────────────────────────

describe('computeAvgGainLoss', () => {
  it('returns zeros for no sells', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 15000 }),
    ]
    const { avgGain, avgLoss } = computeAvgGainLoss(trades)
    expect(avgGain).toBe(0)
    expect(avgLoss).toBe(0)
  })

  it('returns zeros for empty trades', () => {
    const { avgGain, avgLoss } = computeAvgGainLoss([])
    expect(avgGain).toBe(0)
    expect(avgLoss).toBe(0)
  })

  it('computes avg gain when all sells are wins', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 10000, created_at: '2025-01-01T00:00:00Z' }),
      makeTrade({ ticker: 'GOOG', type: 'buy', shares: 5, price_cents: 20000, created_at: '2025-01-02T00:00:00Z' }),
      // AAPL +10%
      makeTrade({ ticker: 'AAPL', type: 'sell', shares: 10, price_cents: 11000, created_at: '2025-01-03T00:00:00Z' }),
      // GOOG +20%
      makeTrade({ ticker: 'GOOG', type: 'sell', shares: 5, price_cents: 24000, created_at: '2025-01-04T00:00:00Z' }),
    ]
    const { avgGain, avgLoss } = computeAvgGainLoss(trades)
    expect(avgGain).toBeCloseTo(15, 1) // (10 + 20) / 2
    expect(avgLoss).toBe(0)
  })

  it('computes mixed gain and loss averages', () => {
    const trades: Trade[] = [
      makeTrade({ ticker: 'AAPL', type: 'buy', shares: 10, price_cents: 10000, created_at: '2025-01-01T00:00:00Z' }),
      makeTrade({ ticker: 'GOOG', type: 'buy', shares: 5, price_cents: 20000, created_at: '2025-01-02T00:00:00Z' }),
      makeTrade({ ticker: 'TSLA', type: 'buy', shares: 8, price_cents: 25000, created_at: '2025-01-03T00:00:00Z' }),
      // AAPL +20%
      makeTrade({ ticker: 'AAPL', type: 'sell', shares: 10, price_cents: 12000, created_at: '2025-01-04T00:00:00Z' }),
      // GOOG -10%
      makeTrade({ ticker: 'GOOG', type: 'sell', shares: 5, price_cents: 18000, created_at: '2025-01-05T00:00:00Z' }),
      // TSLA -20%
      makeTrade({ ticker: 'TSLA', type: 'sell', shares: 8, price_cents: 20000, created_at: '2025-01-06T00:00:00Z' }),
    ]
    const { avgGain, avgLoss } = computeAvgGainLoss(trades)
    expect(avgGain).toBeCloseTo(20, 1) // only AAPL: +20%
    expect(avgLoss).toBeCloseTo(-15, 1) // (-10 + -20) / 2
  })
})
