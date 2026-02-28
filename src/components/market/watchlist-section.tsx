'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { StockCard } from './stock-card'
import type { StockQuote } from '@/types'

interface WatchlistSectionProps {
  tickers: string[]
}

export function WatchlistSection({ tickers }: WatchlistSectionProps) {
  const [quotes, setQuotes] = useState<StockQuote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (tickers.length === 0) {
      setQuotes([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)

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
      setQuotes(results.filter((q): q is StockQuote => q !== null))
      setIsLoading(false)
    })
  }, [tickers])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {tickers.slice(0, 6).map((t) => (
          <Skeleton key={t} className="h-[100px] rounded-lg" />
        ))}
      </div>
    )
  }

  if (quotes.length === 0) {
    return <p className="text-sm text-muted-foreground">No stocks to show</p>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {quotes.map((quote) => (
        <StockCard key={quote.ticker} quote={quote} />
      ))}
    </div>
  )
}
