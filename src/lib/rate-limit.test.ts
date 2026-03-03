import { describe, it, expect } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  it('allows first request', () => {
    const result = checkRateLimit('test-key-1', 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.retryAfterMs).toBe(0)
  })

  it('allows up to maxRequests', () => {
    const key = 'test-key-max'
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true)
    }
  })

  it('blocks after exceeding limit', () => {
    const key = 'test-key-block'
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000)
    }
    const result = checkRateLimit(key, 5, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.retryAfterMs).toBeGreaterThan(0)
  })

  it('uses different keys independently', () => {
    const key1 = 'test-independent-1'
    const key2 = 'test-independent-2'

    for (let i = 0; i < 2; i++) {
      checkRateLimit(key1, 2, 60_000)
    }
    expect(checkRateLimit(key1, 2, 60_000).allowed).toBe(false)
    expect(checkRateLimit(key2, 2, 60_000).allowed).toBe(true)
  })
})
