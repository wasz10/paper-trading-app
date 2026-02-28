'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import type { HoldingWithQuote } from '@/types'

const COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899', '#10b981', '#6366f1', '#f97316']

interface AllocationChartProps {
  holdings: HoldingWithQuote[]
  cashBalance: number
}

export function AllocationChart({ holdings, cashBalance }: AllocationChartProps) {
  if (holdings.length === 0) return null

  const data = [
    ...holdings.map((h) => ({
      name: h.ticker,
      value: h.currentValue,
    })),
    { name: 'Cash', value: cashBalance },
  ]

  return (
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
          >
            {data.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
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
      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
