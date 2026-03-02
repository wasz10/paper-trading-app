import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset the internal store by advancing time past any windows
    vi.useFakeTimers()
  })

  it('allows requests under the limit', () => {
    const result = checkRateLimit('user-1', 3, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.retryAfterMs).toBe(0)
  })

  it('allows up to maxRequests in the window', () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit('user-2', 5, 60_000)
    }
    const result = checkRateLimit('user-2', 5, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('resets after the window expires', () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit('user-3', 3, 10_000)
    }
    expect(checkRateLimit('user-3', 3, 10_000).allowed).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(10_001)

    const result = checkRateLimit('user-3', 3, 10_000)
    expect(result.allowed).toBe(true)
  })

  it('tracks different keys independently', () => {
    for (let i = 0; i < 2; i++) {
      checkRateLimit('user-a', 2, 60_000)
    }
    expect(checkRateLimit('user-a', 2, 60_000).allowed).toBe(false)

    // Different user should still be allowed
    const result = checkRateLimit('user-b', 2, 60_000)
    expect(result.allowed).toBe(true)
  })

  it('returns correct retryAfterMs', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    for (let i = 0; i < 2; i++) {
      checkRateLimit('user-4', 2, 30_000)
    }

    vi.advanceTimersByTime(10_000) // 10s into the 30s window

    const result = checkRateLimit('user-4', 2, 30_000)
    expect(result.allowed).toBe(false)
    // Should have ~20s remaining
    expect(result.retryAfterMs).toBeLessThanOrEqual(20_000)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })
})
