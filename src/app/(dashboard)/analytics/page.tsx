'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { StatsCards } from '@/components/analytics/stats-cards'
import { BestWorstTrades } from '@/components/analytics/best-worst-trades'
import { PnLByTickerChart } from '@/components/analytics/pnl-by-ticker-chart'
import { MonthlyReturnsChart } from '@/components/analytics/monthly-returns-chart'
import type { AnalyticsData } from '@/types/analytics'

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetch('/api/analytics', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load analytics')
        return res.json()
      })
      .then((json) => {
        setData(json.data)
        setIsLoading(false)
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') {
          setError((err as Error).message)
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
        <Skeleton className="h-[250px] rounded-xl" />
        <Skeleton className="h-[250px] rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    )
  }

  if (!data || data.total_trades === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Make your first trade to see analytics!</p>
        <Link
          href="/explore"
          className="text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Explore stocks
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trading Analytics</h1>

      <StatsCards
        totalTrades={data.total_trades}
        winRate={data.win_rate}
        avgGain={data.avg_gain_percent}
        avgLoss={data.avg_loss_percent}
      />

      <BestWorstTrades best={data.best_trade} worst={data.worst_trade} />

      <PnLByTickerChart data={data.pnl_by_ticker} />

      <MonthlyReturnsChart data={data.monthly_returns} />
    </div>
  )
}
