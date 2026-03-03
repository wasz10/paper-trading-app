import { describe, it, expect } from 'vitest'
import {
  calculateReturnPercent,
  getDisplayName,
  calculatePortfolioValue,
  rankEntries,
  calculatePeriodReturnPercent,
} from './calculations'

describe('calculateReturnPercent', () => {
  it('returns 0% for starting balance', () => {
    expect(calculateReturnPercent(1_000_000)).toBe(0)
  })

  it('returns positive % for gains', () => {
    expect(calculateReturnPercent(1_100_000)).toBeCloseTo(10)
  })

  it('returns negative % for losses', () => {
    expect(calculateReturnPercent(900_000)).toBeCloseTo(-10)
  })
})

describe('getDisplayName', () => {
  it('returns display name when shown', () => {
    expect(getDisplayName('abc-1234', 'Alice', true)).toBe('Alice')
  })

  it('returns anonymized name when hidden', () => {
    expect(getDisplayName('abc-1234', 'Alice', false)).toBe('Trader #1234')
  })

  it('returns anonymized name when display name is null', () => {
    expect(getDisplayName('abc-wxyz', null, true)).toBe('Trader #WXYZ')
  })
})

describe('calculatePortfolioValue', () => {
  it('sums cash and holdings', () => {
    const value = calculatePortfolioValue(500_000, [
      { shares: 5, currentPriceCents: 10_000 },
    ])
    expect(value).toBe(550_000)
  })

  it('returns cash when no holdings', () => {
    expect(calculatePortfolioValue(1_000_000, [])).toBe(1_000_000)
  })
})

describe('rankEntries', () => {
  it('sorts by return descending', () => {
    const entries = [
      { display_name: 'A', total_return_pct: 5, is_subscriber: false, is_current_user: false },
      { display_name: 'B', total_return_pct: 15, is_subscriber: false, is_current_user: false },
      { display_name: 'C', total_return_pct: 10, is_subscriber: false, is_current_user: false },
    ]
    const ranked = rankEntries(entries)
    expect(ranked[0].display_name).toBe('B')
    expect(ranked[1].display_name).toBe('C')
    expect(ranked[2].display_name).toBe('A')
  })

  it('limits to N entries', () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      display_name: `User ${i}`,
      total_return_pct: i,
      is_subscriber: false,
      is_current_user: false,
    }))
    expect(rankEntries(entries, 10)).toHaveLength(10)
  })
})

describe('calculatePeriodReturnPercent', () => {
  it('returns period return based on baseline', () => {
    expect(calculatePeriodReturnPercent(1_100_000, 1_000_000)).toBeCloseTo(10)
  })

  it('falls back to starting balance when no baseline', () => {
    expect(calculatePeriodReturnPercent(1_100_000, null)).toBeCloseTo(10)
  })

  it('returns 0 when baseline is 0', () => {
    expect(calculatePeriodReturnPercent(1_100_000, 0)).toBe(0)
  })
})
