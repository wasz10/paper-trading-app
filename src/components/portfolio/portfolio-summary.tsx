'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { PortfolioSummary as PortfolioSummaryType } from '@/types'

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType
}

export function PortfolioSummary({ summary }: PortfolioSummaryProps) {
  const isPositive = summary.totalPL >= 0

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
          <p className="text-3xl font-bold">{formatCurrency(summary.totalValue)}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Cash Available</p>
            <p className="font-semibold">{formatCurrency(summary.cashBalance)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Holdings Value</p>
            <p className="font-semibold">{formatCurrency(summary.holdingsValue)}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total P&L</p>
          <p className={`font-semibold ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {formatCurrency(summary.totalPL)} ({formatPercent(summary.totalPLPercent)})
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
