import type { LeaderboardEntry } from '@/types'

const STARTING_BALANCE_CENTS = 1_000_000 // $10,000

/**
 * Calculate return percentage from a portfolio's total value in cents.
 * Returns ((totalValue - startingBalance) / startingBalance) * 100
 */
export function calculateReturnPercent(totalValueCents: number): number {
  return ((totalValueCents - STARTING_BALANCE_CENTS) / STARTING_BALANCE_CENTS) * 100
}

/**
 * Get the display name for a user, respecting privacy settings.
 * Users with show_display_name=false are shown as "Trader #XXXX" (last 4 of user_id).
 */
export function getDisplayName(
  userId: string,
  displayName: string | null,
  showDisplayName: boolean
): string {
  if (!showDisplayName || !displayName) {
    const last4 = userId.slice(-4).toUpperCase()
    return `Trader #${last4}`
  }
  return displayName
}

/**
 * Calculate total portfolio value in cents given cash balance and holdings with current prices.
 */
export function calculatePortfolioValue(
  cashBalanceCents: number,
  holdings: Array<{ shares: number; currentPriceCents: number }>
): number {
  const holdingsValue = holdings.reduce(
    (sum, h) => sum + Math.round(h.shares * h.currentPriceCents),
    0
  )
  return cashBalanceCents + holdingsValue
}

/**
 * Sort leaderboard entries by return % descending and return top N.
 */
export function rankEntries(
  entries: LeaderboardEntry[],
  limit = 50
): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.total_return_pct - a.total_return_pct)
    .slice(0, limit)
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'all-time'

/**
 * Get the snapshot date to use as the baseline for a given period.
 * daily = 1 day ago, weekly = 7 days ago
 */
export function getPeriodSnapshotDate(period: LeaderboardPeriod): string | null {
  if (period === 'all-time') return null

  const date = new Date()
  if (period === 'daily') {
    date.setDate(date.getDate() - 1)
  } else if (period === 'weekly') {
    date.setDate(date.getDate() - 7)
  }

  return date.toISOString().split('T')[0] // YYYY-MM-DD
}

/**
 * Calculate return percentage for a period given current value and baseline value.
 * If no baseline snapshot exists, falls back to starting balance ($10k = 1_000_000 cents).
 */
export function calculatePeriodReturnPercent(
  currentValueCents: number,
  baselineValueCents: number | null
): number {
  const baseline = baselineValueCents ?? STARTING_BALANCE_CENTS
  if (baseline === 0) return 0
  return ((currentValueCents - baseline) / baseline) * 100
}
