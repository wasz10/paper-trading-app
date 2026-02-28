import { NextResponse } from 'next/server'
import { getChartData } from '@/lib/market/yahoo'
import { getCached, setCache, CACHE_TTL } from '@/lib/market/cache'
import type { ChartDataPoint } from '@/types'
import type { TimeRange } from '@/types/market'

const VALID_RANGES: TimeRange[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL']

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params
  const upperTicker = ticker.toUpperCase()
  const { searchParams } = new URL(request.url)
  const range = (searchParams.get('range') ?? '1M') as TimeRange

  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json(
      { error: `Invalid range. Use: ${VALID_RANGES.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const cacheKey = `chart:${upperTicker}:${range}`
    const cached = getCached<ChartDataPoint[]>(cacheKey)
    if (cached) {
      return NextResponse.json({ data: cached })
    }

    const data = await getChartData(upperTicker, range)
    setCache(cacheKey, data, CACHE_TTL.CHART)

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json(
      { error: `Failed to fetch chart for ${upperTicker}` },
      { status: 400 }
    )
  }
}
