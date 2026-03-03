'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { StockQuote } from '@/types'

function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString()}`
}

function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toLocaleString()
}

interface StatItemProps {
  label: string
  value: string
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
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
    stats.push({ label: 'EPS', value: `$${quote.eps.toFixed(2)}` })
  }
  if (quote.fiftyTwoWeekHigh != null) {
    stats.push({ label: '52W High', value: `$${quote.fiftyTwoWeekHigh.toFixed(2)}` })
  }
  if (quote.fiftyTwoWeekLow != null) {
    stats.push({ label: '52W Low', value: `$${quote.fiftyTwoWeekLow.toFixed(2)}` })
  }
  if (quote.volume != null) {
    stats.push({ label: 'Volume', value: formatVolume(quote.volume) })
  }
  if (quote.avgVolume != null) {
    stats.push({ label: 'Avg Volume', value: formatVolume(quote.avgVolume) })
  }
  if (quote.dividendYield != null) {
    stats.push({ label: 'Dividend Yield', value: `${quote.dividendYield.toFixed(2)}%` })
  }

  if (stats.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Key Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          {stats.map((stat) => (
            <StatItem key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
