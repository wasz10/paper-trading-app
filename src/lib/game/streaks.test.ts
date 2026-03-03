import { describe, it, expect } from 'vitest'
import { calculateStreak } from './streaks'

describe('calculateStreak', () => {
  it('returns streak 1 and canClaim for first login', () => {
    const result = calculateStreak(null, 0, '2026-03-03')
    expect(result).toEqual({ newStreak: 1, canClaim: true })
  })

  it('returns canClaim false when already claimed today', () => {
    const result = calculateStreak('2026-03-03', 5, '2026-03-03')
    expect(result).toEqual({ newStreak: 5, canClaim: false })
  })

  it('increments streak for consecutive day', () => {
    const result = calculateStreak('2026-03-02', 5, '2026-03-03')
    expect(result).toEqual({ newStreak: 6, canClaim: true })
  })

  it('resets streak when gap is more than 1 day', () => {
    const result = calculateStreak('2026-03-01', 5, '2026-03-03')
    expect(result).toEqual({ newStreak: 1, canClaim: true })
  })

  it('resets streak for multi-day gap', () => {
    const result = calculateStreak('2026-02-25', 10, '2026-03-03')
    expect(result).toEqual({ newStreak: 1, canClaim: true })
  })

  it('handles year boundary', () => {
    const result = calculateStreak('2025-12-31', 3, '2026-01-01')
    expect(result).toEqual({ newStreak: 4, canClaim: true })
  })
})
