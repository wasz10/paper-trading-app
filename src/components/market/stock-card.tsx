'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDollars, formatPercent } from '@/lib/utils'
import type { StockQuote } from '@/types'

interface StockCardProps {
  quote: StockQuote
}

export function StockCard({ quote }: StockCardProps) {
  const isPositive = quote.changePercent >= 0

  return (
    <Link href={`/stock/${quote.ticker}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer min-w-[160px]">
        <CardContent className="p-3 space-y-1">
          <div className="font-semibold text-sm">{quote.ticker}</div>
          <div className="text-xs text-muted-foreground truncate max-w-[140px]">
            {quote.name}
          </div>
          <div className="font-medium">{formatDollars(quote.price)}</div>
          <Badge
            variant="secondary"
            className={isPositive ? 'text-gain' : 'text-loss'}
          >
            {formatPercent(quote.changePercent)}
          </Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
