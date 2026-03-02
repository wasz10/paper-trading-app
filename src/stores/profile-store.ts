import { create } from 'zustand'

interface ProfileState {
  displayName: string | null
  tokenBalance: number
  initProfile: (displayName: string | null, tokenBalance: number) => void
  addTokens: (amount: number) => void
}

export const useProfileStore = create<ProfileState>((set) => ({
  displayName: null,
  tokenBalance: 0,

  initProfile: (displayName, tokenBalance) => {
    set({ displayName, tokenBalance })
  },

  addTokens: (amount) => {
    set((state) => ({ tokenBalance: state.tokenBalance + amount }))
  },
}))
