import type { PriceAlert } from '@/types'

/**
 * Evaluate whether a price alert should be triggered.
 */
export function shouldTriggerAlert(
  alert: PriceAlert,
  currentPriceCents: number
): boolean {
  if (alert.status !== 'active') return false

  if (alert.condition === 'above') {
    return currentPriceCents >= alert.target_price_cents
  }

  if (alert.condition === 'below') {
    return currentPriceCents <= alert.target_price_cents
  }

  return false
}
