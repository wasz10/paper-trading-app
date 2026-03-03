'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { TickerPnL } from '@/types/analytics'

interface PnLByTickerChartProps {
  data: TickerPnL[]
}

export function PnLByTickerChart({ data }: PnLByTickerChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">P&L by Ticker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No trade data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    ticker: d.ticker,
    pnl: d.net_pnl_cents / 100,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">P&L by Ticker</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(200, data.length * 40)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
            <XAxis
              type="number"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            />
            <YAxis
              type="category"
              dataKey="ticker"
              tick={{ fontSize: 11 }}
              width={50}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.pnl >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
