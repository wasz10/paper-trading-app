export interface WeeklyChallenge {
  id: string
  title: string
  description: string
  reward: number
  check: (stats: ChallengeStats) => boolean
}

export interface ChallengeStats {
  tradesThisWeek: number
  consecutiveLoginDays: number
  uniqueTickersBought: number
}

export const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'trades_3',
    title: 'Active Trader',
    description: 'Make 3 trades this week',
    reward: 30,
    check: (stats) => stats.tradesThisWeek >= 3,
  },
  {
    id: 'login_5',
    title: 'Dedicated Investor',
    description: 'Log in 5 days in a row',
    reward: 40,
    check: (stats) => stats.consecutiveLoginDays >= 5,
  },
  {
    id: 'new_stock',
    title: 'Diversifier',
    description: 'Buy a stock you\'ve never owned',
    reward: 25,
    check: (stats) => stats.uniqueTickersBought > 0,
  },
]
