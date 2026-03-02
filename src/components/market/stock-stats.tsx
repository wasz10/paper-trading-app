'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDollars } from '@/lib/utils'
import type { StockQuote } from '@/types'

function formatLargeNumber(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return formatDollars(n)
}

function formatVolume(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toLocaleString()
}

interface StockStatsProps {
  quote: StockQuote
}

export function StockStats({ quote }: StockStatsProps) {
  const stats: { label: string; value: string }[] = []

  if (quote.marketCap != null) {
    stats.push({ label: 'Market Cap', value: formatLargeNumber(quote.marketCap) })
  }
  if (quote.peRatio != null) {
    stats.push({ label: 'P/E Ratio', value: quote.peRatio.toFixed(2) })
  }
  if (quote.eps != null) {
    stats.push({ label: 'EPS', value: formatDollars(quote.eps) })
  }
  if (quote.dividendYield != null) {
    stats.push({ label: 'Div Yield', value: `${quote.dividendYield.toFixed(2)}%` })
  }
  if (quote.fiftyTwoWeekHigh != null) {
    stats.push({ label: '52W High', value: formatDollars(quote.fiftyTwoWeekHigh) })
  }
  if (quote.fiftyTwoWeekLow != null) {
    stats.push({ label: '52W Low', value: formatDollars(quote.fiftyTwoWeekLow) })
  }
  if (quote.volume != null) {
    stats.push({ label: 'Volume', value: formatVolume(quote.volume) })
  }
  if (quote.avgVolume != null) {
    stats.push({ label: 'Avg Volume', value: formatVolume(quote.avgVolume) })
  }

  if (stats.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Key Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
