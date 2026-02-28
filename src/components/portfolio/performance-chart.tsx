'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'
import type { PortfolioSnapshot } from '@/types'

type Period = '1W' | '1M' | '3M' | 'ALL'

const PERIOD_DAYS: Record<Period, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  'ALL': 365,
}

const PERIODS: Period[] = ['1W', '1M', '3M', 'ALL']

interface ChartPoint {
  date: string
  value: number
}

export function PerformanceChart() {
  const [period, setPeriod] = useState<Period>('1M')
  const [data, setData] = useState<ChartPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchHistory = useCallback(async (p: Period) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/portfolio/history?days=${PERIOD_DAYS[p]}`)
      if (!res.ok) {
        setData([])
        return
      }
      const json = await res.json()
      const snapshots: PortfolioSnapshot[] = json.data ?? []
      setData(
        snapshots.map((s) => ({
          date: s.snapshot_date,
          value: s.total_value_cents / 100,
        }))
      )
    } catch {
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHistory(period)
  }, [period, fetchHistory])

  function handlePeriod(p: Period) {
    setPeriod(p)
  }

  const formatYAxis = (value: number) => {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`
    return `$${value}`
  }

  const formatXAxis = (date: string) => {
    const d = new Date(date + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Portfolio Performance</CardTitle>
        <CardAction>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => handlePeriod(p)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  period === p
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No data yet — check back tomorrow!
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                width={50}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(Math.round(value * 100)), 'Value']}
                labelFormatter={(label: string) =>
                  new Date(label + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
