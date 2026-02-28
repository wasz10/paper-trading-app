'use client'

import { getRewardForDay } from '@/lib/game/rewards'

interface StreakDisplayProps {
  currentStreak: number
}

export function StreakDisplay({ currentStreak }: StreakDisplayProps) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = i + 1
    const cycleDay = ((currentStreak - 1) % 7) + 1
    const isCompleted = day <= cycleDay
    const isCurrent = day === cycleDay
    const tokens = getRewardForDay(day)

    return { day, tokens, isCompleted, isCurrent }
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{currentStreak}</span>
        <span className="text-sm text-muted-foreground">day streak</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div
            key={d.day}
            className={`flex flex-col items-center p-2 rounded-lg text-xs ${
              d.isCompleted
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            } ${d.isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
          >
            <span className="font-medium">D{d.day}</span>
            <span>{d.tokens}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
