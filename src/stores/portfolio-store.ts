import { create } from 'zustand'
import type { PortfolioSummary } from '@/types'

interface PortfolioState {
  portfolio: PortfolioSummary | null
  isLoading: boolean
  error: string | null
  fetchPortfolio: () => Promise<void>
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  portfolio: null,
  isLoading: false,
  error: null,

  fetchPortfolio: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch('/api/portfolio')
      if (!res.ok) throw new Error('Request failed')
      const json = await res.json()
      if (json.error) {
        set({ error: json.error, isLoading: false })
      } else {
        set({ portfolio: json.data, isLoading: false })
      }
    } catch {
      set({ error: 'Failed to load portfolio', isLoading: false })
    }
  },
}))
