'use client'

import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TutorialStep } from '@/lib/game/tutorial'

interface TutorialQuestLogProps {
  progress: Record<string, boolean>
  steps: TutorialStep[]
  onDismiss: () => void
}

export function TutorialQuestLog({ progress, steps, onDismiss }: TutorialQuestLogProps) {
  const [expanded, setExpanded] = useState(false)
  const completedCount = steps.filter((s) => progress[s.id]).length
  const progressPct = (completedCount / steps.length) * 100

  // Collapsed pill
  if (!expanded) {
    return (
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6">
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 rounded-full border bg-card px-4 py-2 shadow-lg hover:bg-accent transition-colors"
        >
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium">
            {completedCount}/{steps.length} Quests
          </span>
          <ChevronUp className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    )
  }

  // Expanded panel
  return (
    <div className="fixed bottom-20 right-4 z-40 w-72 md:bottom-6">
      <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Quest Log</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(false)}
              className="rounded p-2 text-muted-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Minimize"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              onClick={onDismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2 flex items-center"
            >
              Hide
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{completedCount}/{steps.length} complete</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Quest list */}
        <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
          {steps.map((step) => {
            const done = progress[step.id]
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm',
                  done ? 'text-muted-foreground' : 'text-foreground'
                )}
              >
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                    done ? 'bg-green-500/20 text-green-500' : 'bg-muted'
                  )}
                >
                  {done && <Check className="h-3 w-3" />}
                </div>
                <span className={cn('flex-1 truncate', done && 'line-through')}>
                  {step.title}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium shrink-0',
                    done ? 'text-green-500' : 'text-yellow-500'
                  )}
                >
                  {done ? '' : `+${step.tokens}`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
