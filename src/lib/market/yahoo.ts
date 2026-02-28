import YahooFinance from 'yahoo-finance2'
import type { StockQuote, ChartDataPoint, SearchResult } from '@/types'
import type { TimeRange } from '@/types/market'

const yahooFinance = new YahooFinance()

export async function getQuote(ticker: string): Promise<StockQuote> {
  const result = await yahooFinance.quote(ticker)

  const price = result.regularMarketPrice ?? 0
  const change = result.regularMarketChange ?? 0
  const changePercent = result.regularMarketChangePercent ?? 0

  return {
    ticker: result.symbol ?? ticker,
    price,
    priceCents: Math.round(price * 100),
    change,
    changePercent,
    name: result.shortName ?? result.longName ?? ticker,
    timestamp: Date.now(),
  }
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  const result = await yahooFinance.search(query)

  return (result.quotes ?? [])
    .filter((q): q is typeof q & { symbol: string } =>
      'symbol' in q && typeof q.symbol === 'string' && q.symbol.length > 0
    )
    .filter((q) => {
      const type = 'typeDisp' in q ? (q as Record<string, unknown>).typeDisp : ''
      return type === 'Equity' || type === 'ETF' || !type
    })
    .slice(0, 10)
    .map((q) => ({
      ticker: q.symbol,
      name: ('shortname' in q ? (q as Record<string, unknown>).shortname : '') as string || q.symbol,
      exchange: ('exchange' in q ? (q as Record<string, unknown>).exchange : '') as string || '',
      type: ('typeDisp' in q ? (q as Record<string, unknown>).typeDisp : '') as string || 'Equity',
    }))
}

function getChartParams(range: TimeRange): { period1: Date; interval: '1m' | '5m' | '15m' | '30m' | '1d' | '1wk' | '1mo' } {
  const now = new Date()
  const period1 = new Date(now)

  switch (range) {
    case '1D':
      period1.setDate(now.getDate() - 1)
      return { period1, interval: '5m' }
    case '1W':
      period1.setDate(now.getDate() - 7)
      return { period1, interval: '30m' }
    case '1M':
      period1.setMonth(now.getMonth() - 1)
      return { period1, interval: '1d' }
    case '3M':
      period1.setMonth(now.getMonth() - 3)
      return { period1, interval: '1d' }
    case '1Y':
      period1.setFullYear(now.getFullYear() - 1)
      return { period1, interval: '1wk' }
    case 'ALL':
      period1.setFullYear(now.getFullYear() - 20)
      return { period1, interval: '1mo' }
  }
}

export async function getChartData(ticker: string, range: TimeRange): Promise<ChartDataPoint[]> {
  const { period1, interval } = getChartParams(range)

  const result = await yahooFinance.chart(ticker, {
    period1,
    interval,
  })

  return (result.quotes ?? [])
    .filter((q) => q.close !== null && q.close !== undefined)
    .map((q) => ({
      time: q.date.toISOString().split('T')[0],
      open: q.open ?? undefined,
      high: q.high ?? undefined,
      low: q.low ?? undefined,
      close: q.close!,
      value: q.close!,
      volume: q.volume ?? undefined,
    }))
}
