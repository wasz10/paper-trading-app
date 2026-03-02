'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatPercent } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types'

interface UserRankCardProps {
  entry: LeaderboardEntry | null
  rank: number | null
  totalTraders: number
  isLoading?: boolean
}

export function UserRankCard({ entry, rank, totalTraders, isLoading }: UserRankCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-7 w-20 ml-auto" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!entry || rank === null) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Make your first trade to appear on the leaderboard.
          </p>
        </CardContent>
      </Card>
    )
  }

  const isPositive = entry.total_return_pct >= 0

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Your Rank</p>
          <p className="text-2xl font-bold">
            #{rank}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              of {totalTraders}
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Your Return</p>
          <p className={cn(
            'text-2xl font-bold tabular-nums',
            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          )}>
            {formatPercent(entry.total_return_pct)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
