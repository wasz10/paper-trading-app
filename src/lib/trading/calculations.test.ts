import { describe, it, expect } from 'vitest'
import { calculateWeightedAvgCost, calculateProfitLoss, calculatePortfolioValue } from './calculations'

describe('calculateWeightedAvgCost', () => {
  it('calculates weighted average for new purchase', () => {
    // 10 shares at $100, buy 5 more at $120
    const result = calculateWeightedAvgCost(10, 10000, 5, 12000)
    expect(result).toBe(10667) // (10*100 + 5*120) / 15 = $106.67
  })

  it('returns 0 when total shares is 0', () => {
    expect(calculateWeightedAvgCost(0, 0, 0, 10000)).toBe(0)
  })

  it('returns new price when no existing shares', () => {
    expect(calculateWeightedAvgCost(0, 0, 5, 15000)).toBe(15000)
  })

  it('rounds to nearest cent', () => {
    const result = calculateWeightedAvgCost(3, 10033, 2, 9999)
    // (3*100.33 + 2*99.99) / 5 = 100.194 => 10019 cents
    expect(result).toBe(10019)
  })
})

describe('calculateProfitLoss', () => {
  it('calculates positive P&L', () => {
    const { plCents, plPercent } = calculateProfitLoss(10, 10000, 12000)
    expect(plCents).toBe(20000) // 10 shares * ($120 - $100)
    expect(plPercent).toBeCloseTo(20)
  })

  it('calculates negative P&L', () => {
    const { plCents, plPercent } = calculateProfitLoss(10, 10000, 8000)
    expect(plCents).toBe(-20000)
    expect(plPercent).toBeCloseTo(-20)
  })

  it('returns 0% when avg cost is 0', () => {
    const { plPercent } = calculateProfitLoss(10, 0, 5000)
    expect(plPercent).toBe(0)
  })

  it('handles fractional shares', () => {
    const { plCents } = calculateProfitLoss(0.5, 10000, 12000)
    expect(plCents).toBe(1000) // 0.5 * ($120 - $100) = $10
  })
})

describe('calculatePortfolioValue', () => {
  it('sums cash and holdings', () => {
    const value = calculatePortfolioValue(500000, [
      { shares: 10, currentPriceCents: 10000 },
      { shares: 5, currentPriceCents: 20000 },
    ])
    expect(value).toBe(700000) // $5000 + $1000 + $1000
  })

  it('returns cash only when no holdings', () => {
    expect(calculatePortfolioValue(1000000, [])).toBe(1000000)
  })

  it('rounds holding values', () => {
    const value = calculatePortfolioValue(0, [
      { shares: 3, currentPriceCents: 3333 },
    ])
    expect(value).toBe(9999) // 3 * 33.33 = 99.99
  })
})
