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
