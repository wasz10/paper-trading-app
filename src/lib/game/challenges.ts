export interface WeeklyChallenge {
  id: string
  title: string
  description: string
  reward: number
  target: number
  check: (stats: ChallengeStats) => boolean
  progress: (stats: ChallengeStats) => number
}

export interface ChallengeStats {
  tradesThisWeek: number
  consecutiveLoginDays: number
  newTickersBoughtThisWeek: number
}

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'trades_3',
    title: 'Active Trader',
    description: 'Make 3 trades this week',
    reward: 30,
    target: 3,
    check: (stats) => stats.tradesThisWeek >= 3,
    progress: (stats) => Math.min(stats.tradesThisWeek, 3),
  },
  {
    id: 'login_5',
    title: 'Dedicated Investor',
    description: 'Log in 5 days in a row',
    reward: 40,
    target: 5,
    check: (stats) => stats.consecutiveLoginDays >= 5,
    progress: (stats) => Math.min(stats.consecutiveLoginDays, 5),
  },
  {
    id: 'new_stock',
    title: 'Diversifier',
    description: 'Buy a stock you\'ve never owned',
    reward: 25,
    target: 1,
    check: (stats) => stats.newTickersBoughtThisWeek > 0,
    progress: (stats) => Math.min(stats.newTickersBoughtThisWeek, 1),
  },
]

/**
 * Get the Monday 00:00 UTC of the current week for a given timezone.
 */
export function getWeekStartDate(timezone: string): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const localDate = formatter.format(now) // YYYY-MM-DD
  const date = new Date(localDate + 'T00:00:00Z')
  const dayOfWeek = date.getUTCDay() // 0=Sun, 1=Mon, ...
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  date.setUTCDate(date.getUTCDate() - daysToMonday)
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
