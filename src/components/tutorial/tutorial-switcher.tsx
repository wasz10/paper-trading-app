'use client'

import { TutorialChecklist } from './tutorial-checklist'
import { TutorialWalkthrough } from './tutorial-walkthrough'
import { TutorialQuestLog } from './tutorial-quest-log'
import { TutorialBanner } from './tutorial-banner'
import type { TutorialStep } from '@/lib/game/tutorial'

export type TutorialStyle = 'checklist' | 'walkthrough' | 'quest-log' | 'banner' | 'off'

interface TutorialSwitcherProps {
  style: TutorialStyle
  progress: Record<string, boolean>
  steps: TutorialStep[]
  onDismiss: () => void
  currentPage: string
}

export function TutorialSwitcher({
  style,
  progress,
  steps,
  onDismiss,
  currentPage,
}: TutorialSwitcherProps) {
  if (style === 'off') return null

  switch (style) {
    case 'checklist':
      return <TutorialChecklist progress={progress} steps={steps} onDismiss={onDismiss} />
    case 'walkthrough':
      return <TutorialWalkthrough progress={progress} steps={steps} onDismiss={onDismiss} />
    case 'quest-log':
      return <TutorialQuestLog progress={progress} steps={steps} onDismiss={onDismiss} />
    case 'banner':
      return (
        <TutorialBanner
          progress={progress}
          steps={steps}
          onDismiss={onDismiss}
          currentPage={currentPage}
        />
      )
    default:
      return null
  }
}
