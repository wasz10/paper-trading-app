'use client'

import { X, Check, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TutorialStep } from '@/lib/game/tutorial'

interface TutorialChecklistProps {
  progress: Record<string, boolean>
  steps: TutorialStep[]
  onDismiss: () => void
}

export function TutorialChecklist({ progress, steps, onDismiss }: TutorialChecklistProps) {
  const completedCount = steps.filter((s) => progress[s.id]).length
  const totalTokensRemaining = steps
    .filter((s) => !progress[s.id])
    .reduce((sum, s) => sum + s.tokens, 0)
  const progressPct = (completedCount / steps.length) * 100

  return (
    <div className="relative rounded-xl border bg-gradient-to-br from-indigo-950/50 to-slate-900/50 p-5">
      <button
        onClick={onDismiss}
        className="absolute right-2 top-2 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss tutorial"
      >
        <X className="h-4 w-4" />
      </button>

      <h3 className="text-lg font-semibold mb-1">Getting Started</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Complete quests to earn tokens
      </p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>{completedCount}/{steps.length} complete</span>
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3 text-yellow-500" />
            {totalTokensRemaining} tokens remaining
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Steps grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {steps.map((step) => {
          const done = progress[step.id]
          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                done
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-border bg-card/50'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  done
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Coins className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    done && 'line-through text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {step.description}
                </p>
              </div>
              <span
                className={cn(
                  'text-xs font-medium shrink-0',
                  done ? 'text-green-500' : 'text-yellow-500'
                )}
              >
                {done ? 'Done' : `+${step.tokens}`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
