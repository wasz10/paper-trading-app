'use client'

import { useEffect, useReducer } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CURATED_WATCHLISTS } from '@/lib/market/watchlists'
import { cn, formatDollars, formatPercent } from '@/lib/utils'
import type { StockQuote } from '@/types'

const ALL_TICKERS = [...new Set(CURATED_WATCHLISTS.flatMap((w) => w.tickers))]

interface State {
  quotes: Map<string, StockQuote>
  loading: boolean
}

type Action =
  | { type: 'LOADED'; quotes: Map<string, StockQuote> }
  | { type: 'ERROR' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADED':
      return { quotes: action.quotes, loading: false }
    case 'ERROR':
      return { ...state, loading: false }
  }
}

export function CuratedWatchlists() {
  const [state, dispatch] = useReducer(reducer, {
    quotes: new Map(),
    loading: true,
  })

  useEffect(() => {
    const controller = new AbortController()

    Promise.all(
      ALL_TICKERS.map((ticker) =>
        fetch(`/api/market/quote/${ticker}`, { signal: controller.signal })
          .then((res) => {
            if (!res.ok) return null
            return res.json().then((json) => json.data as StockQuote | null)
          })
          .catch(() => null)
      )
    ).then((results) => {
      if (controller.signal.aborted) return
      const quotes = new Map<string, StockQuote>()
      results.forEach((q, i) => {
        if (q) quotes.set(ALL_TICKERS[i], q)
      })
      dispatch({ type: 'LOADED', quotes })
    })

    return () => controller.abort()
  }, [])

  if (state.loading) {
    return (
      <div className="space-y-4">
        {CURATED_WATCHLISTS.map((list) => (
          <div key={list.id}>
            <div className="mb-2">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-40" />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {list.tickers.map((ticker) => (
                <Card key={ticker} className="shrink-0 w-[140px] p-3">
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-5 w-16 mb-1" />
                  <Skeleton className="h-4 w-14" />
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {CURATED_WATCHLISTS.map((list) => (
        <div key={list.id}>
          <div className="mb-2">
            <h3 className="text-sm font-semibold">{list.title}</h3>
            <p className="text-xs text-muted-foreground">{list.description}</p>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1" role="list" aria-label={`${list.title} stocks`} tabIndex={0}>
            {list.tickers.map((ticker) => {
              const quote = state.quotes.get(ticker)
              if (!quote) return null

              const isPositive = quote.changePercent >= 0

              return (
                <Link key={ticker} href={`/stock/${ticker}`} role="listitem">
                  <Card className="shrink-0 w-[140px] p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                    <p className="text-xs font-semibold truncate">{ticker}</p>
                    <p className="text-sm font-bold mt-1">{formatDollars(quote.price)}</p>
                    <Badge
                      variant="secondary"
                      className={cn('text-xs mt-1', isPositive ? 'text-gain' : 'text-loss')}
                    >
                      {formatPercent(quote.changePercent)}
                    </Badge>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
