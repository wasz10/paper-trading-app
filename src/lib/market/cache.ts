interface CacheEntry<T> {
  data: T
  expires: number
}

const cache = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

export function clearCache(): void {
  cache.clear()
}

export const CACHE_TTL = {
  QUOTE: 60_000,
  CHART: 300_000,
  SEARCH: 600_000,
} as const
