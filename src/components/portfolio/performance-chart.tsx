'use client'

import { useEffect, useReducer, useState } from 'react'
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
import { formatDollars } from '@/lib/utils'
import type { PortfolioSnapshot } from '@/types'

type Period = '1W' | '1M' | '3M' | 'ALL'

const PERIODS: Period[] = ['1W', '1M', '3M', 'ALL']

interface ChartPoint {
  date: string
  value: number
}

type ChartState = { data: ChartPoint[]; isLoading: boolean }
type ChartAction =
  | { type: 'fetch' }
  | { type: 'success'; data: ChartPoint[] }
  | { type: 'error' }

function chartReducer(_state: ChartState, action: ChartAction): ChartState {
  switch (action.type) {
    case 'fetch': return { data: [], isLoading: true }
    case 'success': return { data: action.data, isLoading: false }
    case 'error': return { data: [], isLoading: false }
  }
}

export function PerformanceChart() {
  const [period, setPeriod] = useState<Period>('1M')
  const [state, dispatch] = useReducer(chartReducer, { data: [], isLoading: true })

  useEffect(() => {
    const controller = new AbortController()
    dispatch({ type: 'fetch' })

    fetch(`/api/portfolio/history?period=${period}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) { dispatch({ type: 'error' }); return }
        return res.json()
      })
      .then((json) => {
        if (!json) return
        const snapshots: PortfolioSnapshot[] = json.data ?? []
        dispatch({ type: 'success', data: snapshots.map((s) => ({ date: s.snapshot_date, value: s.total_value_cents / 100 })) })
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') dispatch({ type: 'error' })
      })

    return () => controller.abort()
  }, [period])

  const { data, isLoading } = state

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
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
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
            Your first snapshot will appear tomorrow
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
                formatter={(value: number) => [formatDollars(value), 'Value']}
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
