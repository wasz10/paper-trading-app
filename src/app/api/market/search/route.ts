import { NextResponse } from 'next/server'
import { searchStocks } from '@/lib/market/yahoo'
import { getCached, setCache, CACHE_TTL } from '@/lib/market/cache'
import type { SearchResult } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query || query.length < 1) {
    return NextResponse.json({ data: [] })
  }

  try {
    const cacheKey = `search:${query.toLowerCase()}`
    const cached = getCached<SearchResult[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ data: cached })
    }

    const results = await searchStocks(query)
    setCache(cacheKey, results, CACHE_TTL.SEARCH)

    return NextResponse.json({ data: results })
  } catch {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
