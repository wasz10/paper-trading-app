'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ACHIEVEMENTS } from '@/lib/game/achievement-defs'

interface ProfileAchievementsProps {
  achievementIds: string[]
}

export function ProfileAchievements({ achievementIds }: ProfileAchievementsProps) {
  const unlockedSet = new Set(achievementIds)
  const unlocked = ACHIEVEMENTS.filter((a) => unlockedSet.has(a.id))

  if (unlocked.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">No achievements unlocked yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {unlocked.map((ach) => (
        <Card key={ach.id}>
          <CardContent className="pt-6 text-center space-y-1">
            <div className="text-3xl">{ach.icon}</div>
            <p className="text-sm font-medium">{ach.name}</p>
            <p className="text-xs text-muted-foreground">{ach.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
