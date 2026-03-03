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
import type { MonthlyReturn } from '@/types/analytics'

interface MonthlyReturnsChartProps {
  data: MonthlyReturn[]
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatMonth(yyyyMm: string): string {
  const monthIndex = parseInt(yyyyMm.split('-')[1], 10) - 1
  return MONTH_LABELS[monthIndex] ?? yyyyMm
}

export function MonthlyReturnsChart({ data }: MonthlyReturnsChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Monthly Returns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
            No snapshot data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    return_percent: d.return_percent,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Monthly Returns</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => `${v}%`}
              width={45}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="return_percent" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.return_percent >= 0 ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
