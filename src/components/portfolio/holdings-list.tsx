'use client'

import Link from 'next/link'
import { formatCurrency, formatShares, formatPercent } from '@/lib/utils'
import type { HoldingWithQuote } from '@/types'

interface HoldingsListProps {
  holdings: HoldingWithQuote[]
}

export function HoldingsList({ holdings }: HoldingsListProps) {
  if (holdings.length === 0) return null

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">Holdings</h3>
      {holdings.map((h) => {
        const isPositive = h.profitLossPercent >= 0
        return (
          <Link
            key={h.id}
            href={`/stock/${h.ticker}`}
            className="flex items-center justify-between gap-2 p-3 rounded-lg hover:bg-accent transition-colors min-h-[44px]"
          >
            <div className="min-w-0">
              <span className="font-semibold">{h.ticker}</span>
              <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2">
                {formatShares(h.shares)} shares
              </span>
            </div>
            <div className="text-right shrink-0">
              <div className="font-medium text-sm">{formatCurrency(h.currentValue)}</div>
              <div className={`text-xs sm:text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
                {formatCurrency(h.profitLoss)} ({formatPercent(h.profitLossPercent)})
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
