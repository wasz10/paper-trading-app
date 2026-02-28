'use client'

import { LeaderboardRow } from '@/components/leaderboard/leaderboard-row'
import { Skeleton } from '@/components/ui/skeleton'
import type { LeaderboardEntry } from '@/types'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  isLoading?: boolean
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="h-5 w-8 shrink-0" />
          <Skeleton className="h-5 flex-1" />
          <Skeleton className="h-5 w-16 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function LeaderboardTable({ entries, currentUserId, isLoading }: LeaderboardTableProps) {
  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No traders on the leaderboard yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <div className="w-8 shrink-0 text-center">Rank</div>
        <div className="flex-1">Trader</div>
        <div className="shrink-0 text-right">Return</div>
      </div>

      {/* Rows */}
      {entries.map((entry, index) => (
        <LeaderboardRow
          key={entry.user_id}
          entry={entry}
          rank={index + 1}
          isCurrentUser={entry.user_id === currentUserId}
        />
      ))}
    </div>
  )
}
