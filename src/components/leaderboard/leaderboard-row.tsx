'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { FramedAvatar } from '@/components/ui/framed-avatar'
import { cn, formatPercent } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types'

const rankMedals: Record<number, { emoji: string; label: string }> = {
  1: { emoji: '\uD83E\uDD47', label: 'Gold' },
  2: { emoji: '\uD83E\uDD48', label: 'Silver' },
  3: { emoji: '\uD83E\uDD49', label: 'Bronze' },
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser?: boolean
}

export function LeaderboardRow({ entry, rank, isCurrentUser }: LeaderboardRowProps) {
  const medal = rankMedals[rank]
  const isPositive = entry.total_return_pct >= 0

  const rowContent = (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors min-h-[44px]',
        isCurrentUser && 'bg-primary/5 border border-primary/20',
        !isCurrentUser && 'hover:bg-muted/50',
        entry.user_id && 'cursor-pointer'
      )}
    >
      {/* Rank */}
      <div className="flex items-center justify-center w-8 shrink-0">
        {medal ? (
          <span className="text-lg" title={medal.label}>{medal.emoji}</span>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <FramedAvatar
        initials={entry.display_name.slice(0, 2).toUpperCase()}
        badgeFrame={entry.active_badge_frame}
        size="sm"
        className="shrink-0"
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium truncate',
            isCurrentUser && 'text-primary'
          )}>
            {entry.display_name}
          </span>
          {entry.is_subscriber && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              PRO
            </Badge>
          )}
          {isCurrentUser && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              You
            </Badge>
          )}
        </div>
      </div>

      {/* Return % */}
      <div className="shrink-0 text-right">
        <span className={cn(
          'text-sm font-semibold tabular-nums',
          isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        )}>
          {formatPercent(entry.total_return_pct)}
        </span>
      </div>
    </div>
  )

  if (entry.user_id) {
    return (
      <Link href={`/trader/${entry.user_id}`}>
        {rowContent}
      </Link>
    )
  }

  return rowContent
}
