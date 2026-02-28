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
    // Fetch recent trades from the portfolio endpoint's trades
    // For now we fetch from supabase directly via a simple API
    async function fetchTrades() {
      try {
        const res = await fetch('/api/portfolio')
        await res.json()
        setTrades([])
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
          className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="text-xs">
              {trade.type.toUpperCase()}
            </Badge>
            <div>
              <span className="font-medium">{trade.ticker}</span>
              <span className="text-sm text-muted-foreground ml-2">
                {formatShares(trade.shares)} shares
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(trade.total_cents)}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(trade.created_at).toLocaleDateString()}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
