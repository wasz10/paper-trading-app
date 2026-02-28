'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { formatCurrency, formatShares } from '@/lib/utils'
import type { Trade } from '@/types'

export default function TradeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/trade/${params.id}`)
      .then((res) => res.json())
      .then((json) => {
        setTrade(json.data ?? null)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [params.id])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (!trade) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Trade not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-lg">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {trade.ticker}
            <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'}>
              {trade.type.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shares</span>
            <span>{formatShares(trade.shares)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price per share</span>
            <span>{formatCurrency(trade.price_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{formatCurrency(trade.total_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order type</span>
            <span className="capitalize">{trade.order_type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Date</span>
            <span>{new Date(trade.created_at).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {trade.ai_analysis ?? 'AI analysis will appear here after Phase 6'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
