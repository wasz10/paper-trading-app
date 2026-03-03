'use client'

import { useEffect, useRef } from 'react'
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
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initProfile({ displayName, tokenBalance, activeTheme, activeBadgeFrame })
    }
  }, [displayName, tokenBalance, activeTheme, activeBadgeFrame, initProfile])

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
