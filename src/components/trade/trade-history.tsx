'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatShares } from '@/lib/utils'
import type { Trade } from '@/types'

export function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTrades() {
      try {
        const res = await fetch('/api/trade/history?limit=20&offset=0')
        if (!res.ok) return
        const json = await res.json()
        setTrades(json.data ?? [])
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    fetchTrades()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No trades yet. Start by exploring stocks!
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {trades.map((trade) => (
        <Link
          key={trade.id}
          href={`/trade/${trade.id}`}
          className="flex items-center justify-between gap-2 p-3 rounded-lg hover:bg-accent transition-colors min-h-[44px]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant={trade.type === 'buy' ? 'default' : 'destructive'}
              className={`shrink-0 ${trade.type === 'buy' ? 'bg-green-600 hover:bg-green-700 text-xs' : 'text-xs'}`}
            >
              {trade.type.toUpperCase()}
            </Badge>
            <div className="min-w-0">
              <span className="font-medium">{trade.ticker}</span>
              <span className="text-xs sm:text-sm text-muted-foreground ml-1 sm:ml-2">
                {formatShares(trade.shares)} @ {formatCurrency(trade.price_cents)}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-medium text-sm">{formatCurrency(trade.total_cents)}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(trade.created_at).toLocaleDateString()}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
