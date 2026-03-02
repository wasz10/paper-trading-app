'use client'

import { useEffect, useState } from 'react'
import { X, Check, Coins, Search, TrendingUp, BarChart3, Bot, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TutorialStep } from '@/lib/game/tutorial'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Search,
  TrendingUp,
  BarChart3,
  Bot,
  Gift,
}

interface TutorialBannerProps {
  progress: Record<string, boolean>
  steps: TutorialStep[]
  onDismiss: () => void
  currentPage: string
}

export function TutorialBanner({ progress, steps, onDismiss, currentPage }: TutorialBannerProps) {
  const [justCompleted, setJustCompleted] = useState<string | null>(null)

  // Find the relevant step for the current page
  const relevantStep = steps.find(
    (s) => s.page === currentPage && !progress[s.id]
  )

  // Check if a step was just completed (show green checkmark briefly)
  const justCompletedStep = steps.find(
    (s) => s.page === currentPage && progress[s.id] && justCompleted === s.id
  )

  useEffect(() => {
    if (justCompletedStep) {
      const timer = setTimeout(() => setJustCompleted(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [justCompletedStep])

  // Track when a step becomes completed
  useEffect(() => {
    steps.forEach((s) => {
      if (s.page === currentPage && progress[s.id]) {
        setJustCompleted(s.id)
      }
    })
  }, [progress, steps, currentPage])

  const completedCount = steps.filter((s) => progress[s.id]).length
  const totalTokensRemaining = steps
    .filter((s) => !progress[s.id])
    .reduce((sum, s) => sum + s.tokens, 0)
  const progressPct = (completedCount / steps.length) * 100

  // Show completed animation briefly
  if (justCompletedStep && !relevantStep) {
    const Icon = ICON_MAP[justCompletedStep.icon] ?? Coins
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 mb-4 flex items-center gap-3 animate-in fade-in duration-300">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-500">
          <Check className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">
              {justCompletedStep.title} — Complete!
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!relevantStep) return null

  const Icon = ICON_MAP[relevantStep.icon] ?? Coins

  return (
    <div className="relative rounded-lg border bg-card/80 p-3 mb-4">
      <button
        onClick={onDismiss}
        className="absolute right-1 top-1 rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" />
      </button>

      <div className="flex items-center gap-3 pr-6">
        <div className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          'bg-primary/10 text-primary'
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{relevantStep.title}</p>
          <p className="text-xs text-muted-foreground">{relevantStep.description}</p>
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-yellow-500 shrink-0">
          <Coins className="h-3 w-3" />
          +{relevantStep.tokens}
        </span>
      </div>

      {/* Footer info + progress bar */}
      <div className="mt-2 pt-2 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span>Step {completedCount + 1} of {steps.length}</span>
          <span className="flex items-center gap-1">
            <Coins className="h-3 w-3 text-yellow-500" />
            {totalTokensRemaining} tokens remaining
          </span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
