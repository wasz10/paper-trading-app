import { describe, it, expect } from 'vitest'
import { shouldTriggerAlert } from './engine'
import type { PriceAlert } from '@/types'

function makeAlert(overrides: Partial<PriceAlert>): PriceAlert {
  return {
    id: 'alert-1',
    user_id: 'user-1',
    ticker: 'AAPL',
    condition: 'above',
    target_price_cents: 15000,
    status: 'active',
    triggered_at: null,
    triggered_price_cents: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('shouldTriggerAlert', () => {
  describe('above condition', () => {
    it('triggers when price is at target', () => {
      const alert = makeAlert({ condition: 'above', target_price_cents: 15000 })
      expect(shouldTriggerAlert(alert, 15000)).toBe(true)
    })

    it('triggers when price is above target', () => {
      const alert = makeAlert({ condition: 'above', target_price_cents: 15000 })
      expect(shouldTriggerAlert(alert, 16000)).toBe(true)
    })

    it('does not trigger when price is below target', () => {
      const alert = makeAlert({ condition: 'above', target_price_cents: 15000 })
      expect(shouldTriggerAlert(alert, 14999)).toBe(false)
    })
  })

  describe('below condition', () => {
    it('triggers when price is at target', () => {
      const alert = makeAlert({ condition: 'below', target_price_cents: 15000 })
      expect(shouldTriggerAlert(alert, 15000)).toBe(true)
    })

    it('triggers when price is below target', () => {
      const alert = makeAlert({ condition: 'below', target_price_cents: 15000 })
      expect(shouldTriggerAlert(alert, 14000)).toBe(true)
    })

    it('does not trigger when price is above target', () => {
      const alert = makeAlert({ condition: 'below', target_price_cents: 15000 })
      expect(shouldTriggerAlert(alert, 15001)).toBe(false)
    })
  })

  it('does not trigger for non-active alerts', () => {
    const alert = makeAlert({ status: 'triggered' })
    expect(shouldTriggerAlert(alert, 99999)).toBe(false)
  })

  it('does not trigger for cancelled alerts', () => {
    const alert = makeAlert({ status: 'cancelled' })
    expect(shouldTriggerAlert(alert, 99999)).toBe(false)
  })
})
