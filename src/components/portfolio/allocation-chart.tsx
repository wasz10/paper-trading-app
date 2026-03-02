'use client'

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from 'recharts'
import { formatCurrency, cn } from '@/lib/utils'
import type { HoldingWithQuote } from '@/types'

const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  '#6366f1',
  '#f97316',
]

const CASH_COLOR = '#94a3b8'
const OTHER_COLOR = '#9ca3af'
const OTHER_THRESHOLD = 0.03
const MAX_INDIVIDUAL_HOLDINGS = 5

interface ChartDataItem {
  name: string
  value: number
  color: string
}

interface AllocationChartProps {
  holdings: HoldingWithQuote[]
  cashBalance: number
}

export function AllocationChart({ holdings, cashBalance }: AllocationChartProps) {
  const { data, totalValue } = useMemo(() => {
    if (holdings.length === 0) return { data: [], totalValue: 0 }

    const holdingItems = holdings.map((h) => ({
      name: h.ticker,
      value: h.currentValue,
    }))

    const total = holdingItems.reduce((sum, h) => sum + h.value, 0) + cashBalance

    let mainItems: { name: string; value: number }[] = []
    let otherValue = 0

    if (holdings.length > MAX_INDIVIDUAL_HOLDINGS) {
      for (const item of holdingItems) {
        if (item.value / total < OTHER_THRESHOLD) {
          otherValue += item.value
        } else {
          mainItems.push(item)
        }
      }
    } else {
      mainItems = holdingItems
    }

    const chartData: ChartDataItem[] = mainItems.map((item, index) => ({
      name: item.name,
      value: item.value,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }))

    if (otherValue > 0) {
      chartData.push({ name: 'Other', value: otherValue, color: OTHER_COLOR })
    }

    chartData.push({ name: 'Cash', value: cashBalance, color: CASH_COLOR })

    return { data: chartData, totalValue: total }
  }, [holdings, cashBalance])

  if (holdings.length === 0) return null

  return (
    <div>
      <div className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              dataKey="value"
              paddingAngle={2}
              label={false}
            >
              {data.map((entry, index) => (
                <Cell key={`${entry.name}-${index}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !('cx' in viewBox)) return null
                  const { cx, cy } = viewBox as { cx: number; cy: number }
                  return (
                    <g>
                      <text
                        x={cx}
                        y={cy - 8}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-muted-foreground text-xs"
                      >
                        Total
                      </text>
                      <text
                        x={cx}
                        y={cy + 12}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="fill-foreground text-sm font-semibold"
                      >
                        {formatCurrency(totalValue)}
                      </text>
                    </g>
                  )
                }}
              />
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--popover-foreground))',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1.5 px-2">
        {data.map((item) => {
          const pct = totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : '0.0'
          return (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate font-medium">{item.name}</span>
              <span className={cn('ml-auto tabular-nums text-muted-foreground')}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
