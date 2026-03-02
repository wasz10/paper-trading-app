'use client'

import { useEffect, useReducer, useRef, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { StockCard } from './stock-card'
import { CURATED_WATCHLISTS } from '@/lib/market/watchlists'
import type { StockQuote } from '@/types'

interface State {
  quotes: Map<string, StockQuote>
  isLoading: boolean
}

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_DONE'; quotes: Map<string, StockQuote> }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true }
    case 'FETCH_DONE':
      return { quotes: action.quotes, isLoading: false }
  }
}

export function CuratedWatchlists() {
  const [state, dispatch] = useReducer(reducer, {
    quotes: new Map(),
    isLoading: true,
  })
  const isMounted = useRef(true)

  const allTickers = useMemo(() => {
    const set = new Set<string>()
    for (const wl of CURATED_WATCHLISTS) {
      for (const t of wl.tickers) {
        set.add(t)
      }
    }
    return Array.from(set)
  }, [])

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    dispatch({ type: 'FETCH_START' })

    Promise.all(
      allTickers.map(async (ticker) => {
        try {
          const res = await fetch(`/api/market/quote/${ticker}`)
          const json = await res.json()
          return json.data as StockQuote | null
        } catch {
          return null
        }
      })
    ).then((results) => {
      if (isMounted.current) {
        const map = new Map<string, StockQuote>()
        for (const q of results) {
          if (q) map.set(q.ticker, q)
        }
        dispatch({ type: 'FETCH_DONE', quotes: map })
      }
    })
  }, [allTickers])

  return (
    <div className="space-y-6">
      {CURATED_WATCHLISTS.map((watchlist) => (
        <div key={watchlist.id} className="space-y-2">
          <div>
            <h2 className="text-lg font-semibold">{watchlist.title}</h2>
            <p className="text-sm text-muted-foreground">
              {watchlist.description}
            </p>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide gap-3 pb-1">
            {state.isLoading
              ? watchlist.tickers.map((t) => (
                  <Skeleton
                    key={t}
                    className="h-[100px] min-w-[140px] rounded-lg shrink-0"
                  />
                ))
              : watchlist.tickers
                  .map((t) => state.quotes.get(t))
                  .filter((q): q is StockQuote => q !== undefined)
                  .map((quote) => (
                    <div key={quote.ticker} className="min-w-[140px] shrink-0">
                      <StockCard quote={quote} />
                    </div>
                  ))}
          </div>
        </div>
      ))}
    </div>
  )
}
