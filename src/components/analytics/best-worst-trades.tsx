'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'
import type { TradeHighlight } from '@/types/analytics'

interface BestWorstTradesProps {
  best: TradeHighlight | null
  worst: TradeHighlight | null
}

function TradeCard({ trade, label, variant }: { trade: TradeHighlight | null; label: string; variant: 'best' | 'worst' }) {
  const borderColor = variant === 'best' ? 'border-green-500' : 'border-red-500'
  const pnlColor = variant === 'best' ? 'text-green-500' : 'text-red-500'

  if (!trade) {
    return (
      <Card className={cn('border-2', borderColor)}>
        <CardHeader>
          <CardTitle className="text-sm">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No trades yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-2', borderColor)}>
      <CardHeader>
        <CardTitle className="text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{trade.ticker}</span>
          <span className="text-sm text-muted-foreground">{trade.shares} shares</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Sold at {formatCurrency(trade.price_cents)}
          </span>
          <div className="text-right">
            <p className={cn('font-semibold', pnlColor)}>
              {formatCurrency(trade.pnl_cents)}
            </p>
            <p className={cn('text-sm', pnlColor)}>
              {trade.pnl_percent >= 0 ? '+' : ''}{trade.pnl_percent.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function BestWorstTrades({ best, worst }: BestWorstTradesProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      <TradeCard trade={best} label="Best Trade" variant="best" />
      <TradeCard trade={worst} label="Worst Trade" variant="worst" />
    </div>
  )
}
