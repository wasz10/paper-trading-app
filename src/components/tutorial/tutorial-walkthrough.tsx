'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { TutorialStep } from '@/lib/game/tutorial'

interface TutorialWalkthroughProps {
  progress: Record<string, boolean>
  steps: TutorialStep[]
  onDismiss: () => void
}

const WALKTHROUGH_STEPS = [
  {
    title: 'Welcome to PaperTrade!',
    description:
      'This quick walkthrough will show you around. Complete quests to earn tokens and learn investing.',
  },
  {
    title: 'Explore & Trade',
    description:
      'Search for stocks on the Explore page, then buy your first stock. Each quest earns you tokens!',
  },
  {
    title: 'Track & Learn',
    description:
      'Check your Dashboard for portfolio updates, get AI coaching on trades, and claim daily rewards.',
  },
]

export function TutorialWalkthrough({ onDismiss }: TutorialWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)

  function handleNext() {
    if (currentStep < WALKTHROUGH_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onDismiss()
    }
  }

  const step = WALKTHROUGH_STEPS[currentStep]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
        <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{step.description}</p>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {WALKTHROUGH_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentStep
                  ? 'w-6 bg-primary'
                  : i < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onDismiss}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2"
          >
            Skip all
          </button>
          <Button onClick={handleNext} size="sm">
            {currentStep < WALKTHROUGH_STEPS.length - 1 ? 'Next' : 'Get Started'}
          </Button>
        </div>
      </div>
    </div>
  )
}
