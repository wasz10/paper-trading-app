'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StockChart } from '@/components/market/stock-chart'
import { ArrowLeft } from 'lucide-react'
import { formatDollars, formatPercent } from '@/lib/utils'
import type { StockQuote } from '@/types'

export default function StockDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticker = (params.ticker as string).toUpperCase()
  const [quote, setQuote] = useState<StockQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/market/quote/${ticker}`)
      .then((res) => res.json())
      .then((json) => {
        setQuote(json.data ?? null)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [ticker])

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
        <div className="flex items-baseline gap-2 flex-wrap">
          <h1 className="text-2xl font-bold">{quote.ticker}</h1>
          <span className="text-muted-foreground text-sm truncate max-w-[200px] sm:max-w-none">{quote.name}</span>
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

      <Link href={`/dashboard`} className="block">
        <Button className="w-full md:w-auto" size="lg">
          Buy {ticker}
        </Button>
      </Link>
    </div>
  )
}
