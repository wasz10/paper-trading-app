export interface TutorialStep {
  id: string
  title: string
  description: string
  tokens: number
  icon: string
  page: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'find_stock',
    title: 'Find Your First Stock',
    description: 'Search for any stock on Explore',
    tokens: 25,
    icon: 'Search',
    page: '/explore',
  },
  {
    id: 'first_trade',
    title: 'Make Your First Trade',
    description: 'Buy any stock',
    tokens: 50,
    icon: 'TrendingUp',
    page: '/trade',
  },
  {
    id: 'check_portfolio',
    title: 'Check Your Portfolio',
    description: 'Visit your dashboard after buying',
    tokens: 25,
    icon: 'BarChart3',
    page: '/dashboard',
  },
  {
    id: 'meet_ai_coach',
    title: 'Meet Your AI Coach',
    description: 'View AI analysis on a trade',
    tokens: 50,
    icon: 'Bot',
    page: '/trade',
  },
  {
    id: 'claim_reward',
    title: 'Claim Daily Reward',
    description: 'Visit rewards and claim',
    tokens: 25,
    icon: 'Gift',
    page: '/rewards',
  },
]

export const COMPLETION_BONUS = {
  tokens: 100,
  badge: 'Early Learner',
}

export const TOTAL_TUTORIAL_TOKENS =
  TUTORIAL_STEPS.reduce((sum, s) => sum + s.tokens, 0) + COMPLETION_BONUS.tokens

export interface TutorialProgress {
  steps_completed: Record<string, boolean>
  completed_at: string | null
}

export function getTutorialProgress(stepsCompleted: Record<string, boolean>): {
  completed: string[]
  remaining: string[]
  isComplete: boolean
} {
  const completed = TUTORIAL_STEPS.filter((s) => stepsCompleted[s.id]).map((s) => s.id)
  const remaining = TUTORIAL_STEPS.filter((s) => !stepsCompleted[s.id]).map((s) => s.id)
  const isComplete = remaining.length === 0
  return { completed, remaining, isComplete }
}

export function completeTutorialStep(
  stepsCompleted: Record<string, boolean>,
  stepId: string
): Record<string, boolean> {
  return { ...stepsCompleted, [stepId]: true }
}

export function isTutorialComplete(stepsCompleted: Record<string, boolean>): boolean {
  return TUTORIAL_STEPS.every((s) => stepsCompleted[s.id])
}

export function getCompletedCount(stepsCompleted: Record<string, boolean>): number {
  return TUTORIAL_STEPS.filter((s) => stepsCompleted[s.id]).length
}
