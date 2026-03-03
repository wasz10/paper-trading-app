'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn, formatPercent } from '@/lib/utils'
import { ACHIEVEMENTS } from '@/lib/game/achievement-defs'
import type { PublicProfile } from '@/types/trader'

interface ProfileStatsProps {
  profile: PublicProfile
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const isPositive = profile.total_return_pct >= 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Return</p>
          <p className={cn(
            'text-2xl font-bold tabular-nums',
            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          )}>
            {formatPercent(profile.total_return_pct)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Trades</p>
          <p className="text-2xl font-bold tabular-nums">{profile.trade_count}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Current Streak</p>
          <p className="text-2xl font-bold tabular-nums">
            🔥 {profile.current_streak}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Achievements</p>
          <p className="text-2xl font-bold tabular-nums">
            {profile.achievement_ids.length} / {ACHIEVEMENTS.length}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
