import { NextResponse } from 'next/server'
import { getQuote } from '@/lib/market/yahoo'
import { getCached, setCache, CACHE_TTL } from '@/lib/market/cache'
import type { StockQuote } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params
  const upperTicker = ticker.toUpperCase()

  try {
    const cached = getCached<StockQuote>(`quote:${upperTicker}`)
    if (cached) {
      return NextResponse.json({ data: cached })
    }

    const quote = await getQuote(upperTicker)
    setCache(`quote:${upperTicker}`, quote, CACHE_TTL.QUOTE)

    return NextResponse.json({ data: quote })
  } catch {
    return NextResponse.json(
      { error: `Failed to fetch quote for ${upperTicker}` },
      { status: 400 }
    )
  }
}
