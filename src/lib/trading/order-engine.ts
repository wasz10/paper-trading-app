import type { PendingOrder } from '@/types'

export interface FillResult {
  shouldFill: boolean
  fillPriceCents: number
}

/**
 * Evaluate whether a pending order should be filled at the current price.
 */
export function evaluateOrder(
  order: PendingOrder,
  currentPriceCents: number
): FillResult {
  switch (order.order_type) {
    case 'limit_buy':
      // Fill when price drops to or below the target
      if (order.target_price_cents && currentPriceCents <= order.target_price_cents) {
        return { shouldFill: true, fillPriceCents: currentPriceCents }
      }
      return { shouldFill: false, fillPriceCents: 0 }

    case 'limit_sell':
      // Fill when price rises to or above the target
      if (order.target_price_cents && currentPriceCents >= order.target_price_cents) {
        return { shouldFill: true, fillPriceCents: currentPriceCents }
      }
      return { shouldFill: false, fillPriceCents: 0 }

    case 'stop_loss':
      // Fill when price drops to or below the stop price
      if (order.target_price_cents && currentPriceCents <= order.target_price_cents) {
        return { shouldFill: true, fillPriceCents: currentPriceCents }
      }
      return { shouldFill: false, fillPriceCents: 0 }

    case 'trailing_stop': {
      // Dynamic stop based on high-water mark
      const hwm = order.high_water_mark_cents ?? currentPriceCents
      let dynamicStopCents: number

      if (order.trail_amount_cents) {
        dynamicStopCents = hwm - order.trail_amount_cents
      } else if (order.trail_percent) {
        dynamicStopCents = Math.round(hwm * (1 - Number(order.trail_percent) / 100))
      } else {
        return { shouldFill: false, fillPriceCents: 0 }
      }

      if (currentPriceCents <= dynamicStopCents) {
        return { shouldFill: true, fillPriceCents: currentPriceCents }
      }
      return { shouldFill: false, fillPriceCents: 0 }
    }

    default:
      return { shouldFill: false, fillPriceCents: 0 }
  }
}

/**
 * Calculate the new high-water mark for trailing stop orders.
 */
export function updateHighWaterMark(
  order: PendingOrder,
  currentPriceCents: number
): number {
  const hwm = order.high_water_mark_cents ?? 0
  return Math.max(hwm, currentPriceCents)
}

/**
 * Check if a day order has expired (past 4 PM ET).
 */
export function isDayOrderExpired(order: PendingOrder): boolean {
  if (order.time_in_force !== 'day') return false
  if (!order.expires_at) return false
  return new Date() > new Date(order.expires_at)
}

/**
 * Calculate the expiry time for a day order (4 PM ET today).
 */
export function getDayOrderExpiry(): string {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  et.setHours(16, 0, 0, 0)

  // If already past 4 PM ET, expire immediately (order won't be accepted)
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  if (etNow.getHours() >= 16) {
    return now.toISOString()
  }

  // Convert ET back to UTC for storage
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const dateParts = formatter.format(now)
  const [m, d, y] = dateParts.split('/')
  return new Date(`${y}-${m}-${d}T16:00:00-05:00`).toISOString()
}
