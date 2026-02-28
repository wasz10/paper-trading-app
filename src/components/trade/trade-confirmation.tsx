'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatShares } from '@/lib/utils'
import type { Trade } from '@/types'

interface TradeConfirmationProps {
  trade: Trade
}

export function TradeConfirmation({ trade }: TradeConfirmationProps) {
  const isBuy = trade.type === 'buy'

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Trade Confirmed!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Ticker</span>
          <span className="font-semibold">{trade.ticker}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Type</span>
          <Badge variant={isBuy ? 'default' : 'destructive'}>
            {trade.type.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Shares</span>
          <span>{formatShares(trade.shares)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Price</span>
          <span>{formatCurrency(trade.price_cents)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{formatCurrency(trade.total_cents)}</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/trade/${trade.id}`}>View Trade</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
