import { create } from 'zustand'
import type { Trade, TradeType } from '@/types'

interface TradeState {
  activeTrade: { ticker: string; type: TradeType; price: number } | null
  isExecuting: boolean
  lastTrade: Trade | null
  setActiveTrade: (trade: { ticker: string; type: TradeType; price: number } | null) => void
  executeBuy: (ticker: string, dollarAmount: number) => Promise<Trade | null>
  executeSell: (ticker: string, shares: number) => Promise<Trade | null>
  clearLastTrade: () => void
}

export const useTradeStore = create<TradeState>((set) => ({
  activeTrade: null,
  isExecuting: false,
  lastTrade: null,

  setActiveTrade: (trade) => set({ activeTrade: trade }),

  executeBuy: async (ticker, dollarAmount) => {
    set({ isExecuting: true })
    try {
      const res = await fetch('/api/trade/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, dollarAmount }),
      })
      const json = await res.json()
      if (json.error) {
        set({ isExecuting: false })
        throw new Error(json.error)
      }
      set({ isExecuting: false, lastTrade: json.data, activeTrade: null })
      return json.data
    } catch (e) {
      set({ isExecuting: false })
      throw e
    }
  },

  executeSell: async (ticker, shares) => {
    set({ isExecuting: true })
    try {
      const res = await fetch('/api/trade/sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, shares }),
      })
      const json = await res.json()
      if (json.error) {
        set({ isExecuting: false })
        throw new Error(json.error)
      }
      set({ isExecuting: false, lastTrade: json.data, activeTrade: null })
      return json.data
    } catch (e) {
      set({ isExecuting: false })
      throw e
    }
  },

  clearLastTrade: () => set({ lastTrade: null }),
}))
