import { describe, it, expect } from 'vitest'
import {
  calculateReturnPercent,
  calculatePeriodReturnPercent,
  calculatePortfolioValue,
  getDisplayName,
  getPeriodSnapshotDate,
  rankEntries,
} from './calculations'
import type { LeaderboardEntry } from '@/types'

describe('calculateReturnPercent', () => {
  it('returns 0 for starting balance', () => {
    expect(calculateReturnPercent(1_000_000)).toBe(0)
  })

  it('returns positive for gains', () => {
    expect(calculateReturnPercent(1_100_000)).toBe(10)
  })

  it('returns negative for losses', () => {
    expect(calculateReturnPercent(900_000)).toBe(-10)
  })
})

describe('calculatePeriodReturnPercent', () => {
  it('uses baseline when provided', () => {
    expect(calculatePeriodReturnPercent(1_100_000, 1_000_000)).toBe(10)
  })

  it('falls back to starting balance when baseline is null', () => {
    expect(calculatePeriodReturnPercent(1_100_000, null)).toBe(10)
  })

  it('returns 0 when baseline is 0', () => {
    expect(calculatePeriodReturnPercent(500_000, 0)).toBe(0)
  })
})

describe('calculatePortfolioValue', () => {
  it('returns cash when no holdings', () => {
    expect(calculatePortfolioValue(500_000, [])).toBe(500_000)
  })

  it('sums cash + holdings value', () => {
    const result = calculatePortfolioValue(500_000, [
      { shares: 10, currentPriceCents: 15000 },
      { shares: 5, currentPriceCents: 20000 },
    ])
    expect(result).toBe(500_000 + 150_000 + 100_000)
  })
})

describe('getDisplayName', () => {
  it('returns display name when show is true', () => {
    expect(getDisplayName('abc-def-1234', 'Alice', true)).toBe('Alice')
  })

  it('returns masked name when show is false', () => {
    const result = getDisplayName('abc-def-1234', 'Alice', false)
    expect(result).toBe('Trader #1234')
  })

  it('returns masked name when display name is null', () => {
    const result = getDisplayName('abc-def-5678', null, true)
    expect(result).toBe('Trader #5678')
  })
})

describe('getPeriodSnapshotDate', () => {
  it('returns null for all-time', () => {
    expect(getPeriodSnapshotDate('all-time')).toBeNull()
  })

  it('returns a date string for daily', () => {
    const result = getPeriodSnapshotDate('daily')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a date string for weekly', () => {
    const result = getPeriodSnapshotDate('weekly')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('rankEntries', () => {
  const entries: LeaderboardEntry[] = [
    { display_name: 'A', total_return_pct: 5, is_subscriber: false, is_current_user: false },
    { display_name: 'B', total_return_pct: 15, is_subscriber: false, is_current_user: true },
    { display_name: 'C', total_return_pct: 10, is_subscriber: true, is_current_user: false },
  ]

  it('sorts by return descending', () => {
    const ranked = rankEntries(entries)
    expect(ranked[0].display_name).toBe('B')
    expect(ranked[1].display_name).toBe('C')
    expect(ranked[2].display_name).toBe('A')
  })

  it('respects limit', () => {
    const ranked = rankEntries(entries, 2)
    expect(ranked).toHaveLength(2)
  })

  it('preserves is_current_user', () => {
    const ranked = rankEntries(entries)
    expect(ranked[0].is_current_user).toBe(true)
  })
})
