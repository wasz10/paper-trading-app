'use client'

import { useEffect } from 'react'
import { useProfileStore } from '@/stores/profile-store'

interface ProfileInitializerProps {
  displayName: string | null
  tokenBalance: number
  activeTheme: string | null
  activeBadgeFrame: string | null
}

export function ProfileInitializer({
  displayName,
  tokenBalance,
  activeTheme,
  activeBadgeFrame,
}: ProfileInitializerProps) {
  const initProfile = useProfileStore((s) => s.initProfile)

  useEffect(() => {
    initProfile({ displayName, tokenBalance, activeTheme, activeBadgeFrame })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Apply theme data attribute to document
  useEffect(() => {
    if (activeTheme) {
      document.documentElement.setAttribute('data-theme', activeTheme)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [activeTheme])

  return null
}
