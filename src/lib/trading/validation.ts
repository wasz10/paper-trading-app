export interface ValidationResult {
  valid: boolean
  error?: string
}

const FREE_TRADE_LIMIT = 2
const SUBSCRIBER_TRADE_LIMIT = 6

export function validateBuy(
  cashBalanceCents: number,
  totalCents: number,
  tradesToday: number,
  isSubscriber: boolean
): ValidationResult {
  if (totalCents < 100) {
    return { valid: false, error: 'Minimum trade amount is $1.00' }
  }

  if (cashBalanceCents < totalCents) {
    return { valid: false, error: 'Insufficient funds' }
  }

  const limit = isSubscriber ? SUBSCRIBER_TRADE_LIMIT : FREE_TRADE_LIMIT
  if (tradesToday >= limit) {
    return {
      valid: false,
      error: `Daily trade limit reached (${limit}/${limit}). ${isSubscriber ? '' : 'Upgrade to get 6 trades/day.'}`.trim(),
    }
  }

  return { valid: true }
}

export function validateSell(
  sharesOwned: number,
  sharesToSell: number,
  _pricePerShareCents: number
): ValidationResult {
  if (sharesToSell <= 0) {
    return { valid: false, error: 'Must sell a positive number of shares' }
  }

  if (sharesToSell > sharesOwned) {
    return { valid: false, error: `You only own ${sharesOwned} shares` }
  }

  return { valid: true }
}

export function isDustPosition(
  sharesRemaining: number,
  pricePerShareCents: number
): boolean {
  return sharesRemaining * pricePerShareCents < 1
}

export function calculateShares(
  dollarAmountCents: number,
  pricePerShareCents: number
): number {
  return Math.floor((dollarAmountCents / pricePerShareCents) * 1e6) / 1e6
}
