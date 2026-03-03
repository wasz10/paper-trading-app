'use client'

import { useEffect, useReducer } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'
import { StockCard } from '@/components/market/stock-card'
import type { StockQuote } from '@/types'
import type { WatchlistItem } from '@/types/watchlist'

interface State {
  quotes: StockQuote[]
  isLoading: boolean
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_DONE'; quotes: StockQuote[] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true }
    case 'FETCH_DONE':
      return { quotes: action.quotes, isLoading: false }
  }
}

export function UserWatchlistGrid() {
  const [state, dispatch] = useReducer(reducer, { quotes: [], isLoading: true })

  useEffect(() => {
    const controller = new AbortController()
    dispatch({ type: 'FETCH_START' })

    fetch('/api/watchlist', { signal: controller.signal })
      .then((res) => res.json())
      .then(async (json) => {
        const items: WatchlistItem[] = json.data ?? []

        if (items.length === 0) {
          if (!controller.signal.aborted) {
            dispatch({ type: 'FETCH_DONE', quotes: [] })
          }
          return
        }

        const results = await Promise.all(
          items.map(async (item) => {
            try {
              const res = await fetch(`/api/market/quote/${item.ticker}`, { signal: controller.signal })
              const quoteJson = await res.json()
              return quoteJson.data as StockQuote | null
            } catch {
              return null
            }
          })
        )

        if (!controller.signal.aborted) {
          dispatch({
            type: 'FETCH_DONE',
            quotes: results.filter((q): q is StockQuote => q !== null),
          })
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && !controller.signal.aborted) {
          dispatch({ type: 'FETCH_DONE', quotes: [] })
        }
      })

    return () => controller.abort()
  }, [])

  if (state.isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>
    )
  }

  if (state.quotes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No stocks in your watchlist yet.{' '}
        <Link href="/explore" className="text-primary underline">
          Browse the market to add some!
        </Link>
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {state.quotes.map((quote) => (
        <StockCard key={quote.ticker} quote={quote} />
      ))}
    </div>
  )
}
