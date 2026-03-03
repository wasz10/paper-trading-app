import { describe, it, expect } from 'vitest'
import { evaluateOrder, updateHighWaterMark, isDayOrderExpired } from './order-engine'
import type { PendingOrder } from '@/types'

function makeOrder(overrides: Partial<PendingOrder>): PendingOrder {
  return {
    id: 'test-id',
    user_id: 'user-1',
    ticker: 'AAPL',
    order_type: 'limit_buy',
    time_in_force: 'gtc',
    target_price_cents: null,
    trail_amount_cents: null,
    trail_percent: null,
    high_water_mark_cents: null,
    shares: 10,
    reserved_cash_cents: 0,
    status: 'pending',
    filled_price_cents: null,
    filled_at: null,
    trade_id: null,
    created_at: new Date().toISOString(),
    expires_at: null,
    ...overrides,
  }
}

describe('evaluateOrder', () => {
  describe('limit_buy', () => {
    it('fills when price is at or below target', () => {
      const order = makeOrder({ order_type: 'limit_buy', target_price_cents: 15000 })
      expect(evaluateOrder(order, 14500).shouldFill).toBe(true)
      expect(evaluateOrder(order, 15000).shouldFill).toBe(true)
    })

    it('does not fill when price is above target', () => {
      const order = makeOrder({ order_type: 'limit_buy', target_price_cents: 15000 })
      expect(evaluateOrder(order, 15100).shouldFill).toBe(false)
    })

    it('returns current price as fill price', () => {
      const order = makeOrder({ order_type: 'limit_buy', target_price_cents: 15000 })
      expect(evaluateOrder(order, 14000).fillPriceCents).toBe(14000)
    })
  })

  describe('limit_sell', () => {
    it('fills when price is at or above target', () => {
      const order = makeOrder({ order_type: 'limit_sell', target_price_cents: 20000 })
      expect(evaluateOrder(order, 20000).shouldFill).toBe(true)
      expect(evaluateOrder(order, 21000).shouldFill).toBe(true)
    })

    it('does not fill when price is below target', () => {
      const order = makeOrder({ order_type: 'limit_sell', target_price_cents: 20000 })
      expect(evaluateOrder(order, 19999).shouldFill).toBe(false)
    })
  })

  describe('stop_loss', () => {
    it('fills when price drops to stop price', () => {
      const order = makeOrder({ order_type: 'stop_loss', target_price_cents: 14000 })
      expect(evaluateOrder(order, 14000).shouldFill).toBe(true)
      expect(evaluateOrder(order, 13000).shouldFill).toBe(true)
    })

    it('does not fill above stop price', () => {
      const order = makeOrder({ order_type: 'stop_loss', target_price_cents: 14000 })
      expect(evaluateOrder(order, 14001).shouldFill).toBe(false)
    })
  })

  describe('trailing_stop', () => {
    it('fills when price drops by trail amount from HWM', () => {
      const order = makeOrder({
        order_type: 'trailing_stop',
        trail_amount_cents: 500,
        high_water_mark_cents: 15000,
      })
      // Dynamic stop = 15000 - 500 = 14500
      expect(evaluateOrder(order, 14500).shouldFill).toBe(true)
      expect(evaluateOrder(order, 14000).shouldFill).toBe(true)
    })

    it('does not fill above dynamic stop', () => {
      const order = makeOrder({
        order_type: 'trailing_stop',
        trail_amount_cents: 500,
        high_water_mark_cents: 15000,
      })
      expect(evaluateOrder(order, 14600).shouldFill).toBe(false)
    })

    it('fills when price drops by trail percent from HWM', () => {
      const order = makeOrder({
        order_type: 'trailing_stop',
        trail_percent: 5,
        high_water_mark_cents: 20000,
      })
      // Dynamic stop = 20000 * (1 - 0.05) = 19000
      expect(evaluateOrder(order, 19000).shouldFill).toBe(true)
    })

    it('returns no fill when no trail config', () => {
      const order = makeOrder({ order_type: 'trailing_stop', high_water_mark_cents: 15000 })
      expect(evaluateOrder(order, 10000).shouldFill).toBe(false)
    })
  })
})

describe('updateHighWaterMark', () => {
  it('updates when current price exceeds HWM', () => {
    const order = makeOrder({ high_water_mark_cents: 15000 })
    expect(updateHighWaterMark(order, 16000)).toBe(16000)
  })

  it('keeps existing HWM when price is lower', () => {
    const order = makeOrder({ high_water_mark_cents: 15000 })
    expect(updateHighWaterMark(order, 14000)).toBe(15000)
  })

  it('handles null HWM', () => {
    const order = makeOrder({ high_water_mark_cents: null })
    expect(updateHighWaterMark(order, 10000)).toBe(10000)
  })
})

describe('isDayOrderExpired', () => {
  it('returns false for GTC orders', () => {
    const order = makeOrder({ time_in_force: 'gtc' })
    expect(isDayOrderExpired(order)).toBe(false)
  })

  it('returns false when no expires_at', () => {
    const order = makeOrder({ time_in_force: 'day', expires_at: null })
    expect(isDayOrderExpired(order)).toBe(false)
  })

  it('returns true when expires_at is in the past', () => {
    const past = new Date(Date.now() - 60_000).toISOString()
    const order = makeOrder({ time_in_force: 'day', expires_at: past })
    expect(isDayOrderExpired(order)).toBe(true)
  })

  it('returns false when expires_at is in the future', () => {
    const future = new Date(Date.now() + 3_600_000).toISOString()
    const order = makeOrder({ time_in_force: 'day', expires_at: future })
    expect(isDayOrderExpired(order)).toBe(false)
  })
})
