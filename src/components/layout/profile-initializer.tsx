'use client'

import { useEffect, useRef } from 'react'
import { useProfileStore } from '@/stores/profile-store'

interface ProfileInitializerProps {
  displayName: string | null
  tokenBalance: number
}

export function ProfileInitializer({ displayName, tokenBalance }: ProfileInitializerProps) {
  const initProfile = useProfileStore((s) => s.initProfile)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      initProfile(displayName, tokenBalance)
    }
  }, [displayName, tokenBalance, initProfile])

  return null
}
