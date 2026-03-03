'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AchievementDef } from '@/lib/game/achievements'

interface AchievementData extends AchievementDef {
  unlocked: boolean
  unlockedAt: string | null
  progress: number
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/achievements')
      .then((res) => res.json())
      .then((json) => {
        setAchievements(json.data ?? [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <AchievementCard key={ach.id} achievement={ach} />
        ))}
      </div>
    </div>
  )
}

function AchievementCard({ achievement }: { achievement: AchievementData }) {
  const progressPct = achievement.target > 0
    ? Math.min(100, (achievement.progress / achievement.target) * 100)
    : 0

  return (
    <Card className={achievement.unlocked ? '' : 'opacity-60'}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{achievement.icon}</span>
            <div>
              <p className="font-medium text-sm">{achievement.name}</p>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
            </div>
          </div>
          {achievement.unlocked ? (
            <Badge variant="secondary" className="text-gain shrink-0">Unlocked</Badge>
          ) : (
            <Badge variant="outline" className="shrink-0">+{achievement.tokens}</Badge>
          )}
        </div>

        {!achievement.unlocked && achievement.target > 1 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{formatProgress(achievement)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/60 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {achievement.unlocked && achievement.unlockedAt && (
          <p className="text-[11px] text-muted-foreground">
            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function formatProgress(ach: AchievementData): string {
  if (ach.category === 'profit') {
    return `$${(ach.progress / 100).toLocaleString()} / $${(ach.target / 100).toLocaleString()}`
  }
  if (ach.category === 'portfolio') {
    return `$${(ach.progress / 100).toLocaleString()} / $${(ach.target / 100).toLocaleString()}`
  }
  return `${ach.progress} / ${ach.target}`
}
