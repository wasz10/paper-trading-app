import { create } from 'zustand'

interface ProfileState {
  displayName: string | null
  tokenBalance: number
  activeTheme: string | null
  activeBadgeFrame: string | null
  initProfile: (data: {
    displayName: string | null
    tokenBalance: number
    activeTheme: string | null
    activeBadgeFrame: string | null
  }) => void
  addTokens: (amount: number) => void
  refetchBalance: () => Promise<void>
  setActiveTheme: (theme: string | null) => void
  setActiveBadgeFrame: (frame: string | null) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  displayName: null,
  tokenBalance: 0,
  activeTheme: null,
  activeBadgeFrame: null,

  initProfile: ({ displayName, tokenBalance, activeTheme, activeBadgeFrame }) => {
    set({ displayName, tokenBalance, activeTheme, activeBadgeFrame })
  },

  addTokens: (amount) => {
    set((state) => ({ tokenBalance: state.tokenBalance + amount }))
  },

  refetchBalance: async () => {
    try {
      const res = await fetch('/api/profile/balance')
      const json = await res.json()
      if (json.data) {
        set({ tokenBalance: json.data.tokenBalance })
      }
    } catch {
      // Silently fail — header keeps its current value
    }
  },

  setActiveTheme: (theme) => {
    set({ activeTheme: theme })
  },

  setActiveBadgeFrame: (frame) => {
    set({ activeBadgeFrame: frame })
  },
}))
