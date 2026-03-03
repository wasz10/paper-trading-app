'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StockChart } from '@/components/market/stock-chart'
import { StockStats } from '@/components/market/stock-stats'
import { BuyModal } from '@/components/trade/buy-modal'
import { SellModal } from '@/components/trade/sell-modal'
import { usePortfolioStore } from '@/stores/portfolio-store'
import { AlertButton } from '@/components/market/alert-button'
import { WatchlistButton } from '@/components/watchlist/watchlist-button'
import { ArrowLeft } from 'lucide-react'
import { formatDollars, formatPercent } from '@/lib/utils'
import type { StockQuote } from '@/types'

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticker = (params.ticker as string).toUpperCase()
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [buyOpen, setBuyOpen] = useState(false)
  const [sellOpen, setSellOpen] = useState(false)

  const { portfolio, fetchPortfolio } = usePortfolioStore()

  const cashBalance = portfolio?.cashBalance ?? 0
  const holding = portfolio?.holdings.find((h) => h.ticker === ticker)
  const sharesOwned = holding?.shares ?? 0

  const fetchQuote = useCallback(() => {
    fetch(`/api/market/quote/${ticker}`)
      .then((res) => res.json())
      .then((json) => {
        setQuote(json.data ?? null)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [ticker])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  useEffect(() => {
    if (!portfolio) fetchPortfolio()
  }, [portfolio, fetchPortfolio])

  function handleTradeSuccess() {
    fetchQuote()
    fetchPortfolio()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Stock not found: {ticker}</p>
      </div>
    )
  }

  const isPositive = quote.changePercent >= 0

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">{quote.ticker}</h1>
          <span className="text-muted-foreground text-sm truncate max-w-[200px] sm:max-w-none">{quote.name}</span>
          <div className="ml-auto flex items-center gap-2">
            <WatchlistButton ticker={ticker} />
            <AlertButton ticker={ticker} currentPrice={quote.price} />
          </div>
        </div>
        <div className="flex items-baseline gap-3 mt-1 flex-wrap">
          <span className="text-3xl sm:text-4xl font-bold">{formatDollars(quote.price)}</span>
          <Badge
            variant="secondary"
            className={isPositive ? 'text-gain' : 'text-loss'}
          >
            {isPositive ? '+' : ''}{formatDollars(quote.change)} ({formatPercent(quote.changePercent)})
          </Badge>
        </div>
      </div>

      <StockChart ticker={ticker} />

      <StockStats quote={quote} />

      <div className="flex gap-3">
        <Button className="flex-1 md:flex-none" size="lg" onClick={() => setBuyOpen(true)}>
          Buy {ticker}
        </Button>
        {sharesOwned > 0 && (
          <Button
            className="flex-1 md:flex-none"
            size="lg"
            variant="destructive"
            onClick={() => setSellOpen(true)}
          >
            Sell {ticker}
          </Button>
        )}
      </div>

      {quote && (
        <>
          <BuyModal
            ticker={ticker}
            price={quote.price}
            cashBalance={cashBalance}
            open={buyOpen}
            onOpenChange={setBuyOpen}
            onSuccess={handleTradeSuccess}
          />
          <SellModal
            ticker={ticker}
            price={quote.price}
            sharesOwned={sharesOwned}
            open={sellOpen}
            onOpenChange={setSellOpen}
            onSuccess={handleTradeSuccess}
          />
        </>
      )}
    </div>
  )
}
