'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  totalTrades: number
  winRate: number
  avgGain: number
  avgLoss: number
}

export function StatsCards({ totalTrades, winRate, avgGain, avgLoss }: StatsCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Trades</p>
          <p className="text-2xl font-bold">{totalTrades}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className={cn('text-2xl font-bold', winRate >= 50 ? 'text-green-500' : 'text-red-500')}>
            {winRate.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Avg Gain</p>
          <p className="text-2xl font-bold text-green-500">
            +{avgGain.toFixed(2)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Avg Loss</p>
          <p className="text-2xl font-bold text-red-500">
            {avgLoss.toFixed(2)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
