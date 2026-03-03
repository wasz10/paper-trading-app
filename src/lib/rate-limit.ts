interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
const MAX_STORE_SIZE = 10_000
let sweepCounter = 0

/**
 * Simple in-memory sliding-window rate limiter.
 * Resets on serverless cold start — acceptable as a soft abuse guard.
 * Evicts expired entries every 100 calls and caps at 10k entries.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(key)

  // Periodic sweep of expired entries to prevent unbounded growth
  sweepCounter++
  if (sweepCounter >= 100) {
    sweepCounter = 0
    for (const [k, v] of store) {
      if (now >= v.resetAt) store.delete(k)
    }
  }

  // Hard cap — flush everything if store grows too large
  if (store.size > MAX_STORE_SIZE) {
    store.clear()
  }

  // Clean up expired entry
  if (entry && now >= entry.resetAt) {
    store.delete(key)
  }

  const current = store.get(key)

  if (!current) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterMs: 0 }
  }

  if (current.count < maxRequests) {
    current.count++
    return { allowed: true, retryAfterMs: 0 }
  }

  return { allowed: false, retryAfterMs: current.resetAt - now }
}
