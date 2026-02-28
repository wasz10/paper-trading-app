'use client'

import { useEffect, useReducer, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { StockCard } from './stock-card'
import type { StockQuote } from '@/types'

interface WatchlistSectionProps {
  tickers: string[]
}

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

export function WatchlistSection({ tickers }: WatchlistSectionProps) {
  const [state, dispatch] = useReducer(reducer, { quotes: [], isLoading: true })
  const isMounted = useRef(true)

  useEffect(() => {
    return () => { isMounted.current = false }
  }, [])

  useEffect(() => {
    if (tickers.length === 0) {
      dispatch({ type: 'FETCH_DONE', quotes: [] })
      return
    }

    dispatch({ type: 'FETCH_START' })

    Promise.all(
      tickers.map(async (ticker) => {
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
        dispatch({
          type: 'FETCH_DONE',
          quotes: results.filter((q): q is StockQuote => q !== null),
        })
      }
    })
  }, [tickers])

  if (tickers.length === 0) {
    return <p className="text-sm text-muted-foreground">No stocks to show</p>
  }

  if (state.isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tickers.slice(0, 6).map((t) => (
          <Skeleton key={t} className="h-[100px] rounded-lg" />
        ))}
      </div>
    )
  }

  if (state.quotes.length === 0) {
    return <p className="text-sm text-muted-foreground">No stocks to show</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {state.quotes.map((quote) => (
        <StockCard key={quote.ticker} quote={quote} />
      ))}
    </div>
  )
}
