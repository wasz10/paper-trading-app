'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WEEKLY_CHALLENGES } from '@/lib/game/challenges'

interface WeeklyChallengeListProps {
  completedIds: string[]
}

export function WeeklyChallengeList({ completedIds }: WeeklyChallengeListProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Weekly Challenges</h3>
      {WEEKLY_CHALLENGES.map((challenge) => {
        const isCompleted = completedIds.includes(challenge.id)
        return (
          <Card key={challenge.id} className={isCompleted ? 'opacity-60' : ''}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{challenge.title}</p>
                <p className="text-sm text-muted-foreground">{challenge.description}</p>
              </div>
              <Badge variant={isCompleted ? 'secondary' : 'default'}>
                {isCompleted ? 'Done' : `+${challenge.reward}`}
              </Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
