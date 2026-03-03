import { describe, it, expect } from 'vitest'
import { getRewardForDay, getNextRewardPreview } from './rewards'

describe('getRewardForDay', () => {
  it('returns 10 for day 1', () => {
    expect(getRewardForDay(1)).toBe(10)
  })

  it('returns 15 for day 2', () => {
    expect(getRewardForDay(2)).toBe(15)
  })

  it('returns 50 for day 7 (weekly bonus)', () => {
    expect(getRewardForDay(7)).toBe(50)
  })

  it('cycles back after day 7', () => {
    expect(getRewardForDay(8)).toBe(10)
    expect(getRewardForDay(14)).toBe(50)
    expect(getRewardForDay(15)).toBe(10)
  })

  it('returns 20 for mid-week days', () => {
    expect(getRewardForDay(3)).toBe(20)
    expect(getRewardForDay(4)).toBe(20)
    expect(getRewardForDay(5)).toBe(20)
    expect(getRewardForDay(6)).toBe(20)
  })
})

describe('getNextRewardPreview', () => {
  it('returns 7 upcoming rewards', () => {
    const preview = getNextRewardPreview(3)
    expect(preview).toHaveLength(7)
    expect(preview[0]).toEqual({ day: 4, tokens: 20 })
    expect(preview[6]).toEqual({ day: 10, tokens: 20 })
  })

  it('starts from streak+1', () => {
    const preview = getNextRewardPreview(0)
    expect(preview[0].day).toBe(1)
    expect(preview[0].tokens).toBe(10)
  })
})
