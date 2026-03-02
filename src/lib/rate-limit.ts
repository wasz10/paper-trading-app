interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory sliding-window rate limiter.
 * Resets on serverless cold start — acceptable as a soft abuse guard.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = store.get(key)

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
