'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Brain } from 'lucide-react'
import { toast } from 'sonner'

interface TradeAnalysisCardProps {
  tradeId: string
  existingAnalysis?: string | null
}

export function TradeAnalysisCard({ tradeId, existingAnalysis }: TradeAnalysisCardProps) {
  const [analysis, setAnalysis] = useState(existingAnalysis ?? null)
  const [isLoading, setIsLoading] = useState(false)

  async function requestAnalysis() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/trade/${tradeId}/analysis`, { method: 'POST' })
      const json = await res.json()

      if (json.error) {
        toast.error(json.error)
        return
      }

      setAnalysis(json.data.analysis)
      if (json.data.tokenCost > 0) {
        toast.info(`Used ${json.data.tokenCost} tokens`)
      }
    } catch {
      toast.error('Failed to get analysis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" />
          AI Coach Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : analysis ? (
          <p className="text-sm leading-relaxed">{analysis}</p>
        ) : (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Get AI insights on this trade (1st daily free, then 5 tokens)
            </p>
            <Button size="sm" onClick={requestAnalysis}>
              <Brain className="h-3 w-3 mr-1" />
              Get Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
