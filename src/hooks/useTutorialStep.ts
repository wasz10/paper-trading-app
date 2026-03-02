'use client'

import { useEffect, useState, useRef } from 'react'
import { useProfileStore } from '@/stores/profile-store'

interface UseTutorialStepResult {
  completed: boolean
  loading: boolean
  tokensEarned: number
}

export function useTutorialStep(stepId: string): UseTutorialStepResult {
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tokensEarned, setTokensEarned] = useState(0)
  const addTokens = useProfileStore((s) => s.addTokens)
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    async function completeStep() {
      try {
        const res = await fetch('/api/tutorial/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step_id: stepId }),
        })

        if (res.ok) {
          const json = await res.json()
          const earned = json.data?.tokensEarned ?? 0
          setCompleted(true)
          setTokensEarned(earned)
          if (earned > 0) addTokens(earned)
        } else {
          // Step might already be completed — treat as completed
          const json = await res.json().catch(() => null)
          if (json?.error === 'Step already completed') {
            setCompleted(true)
          }
        }
      } catch {
        // Silently fail — tutorial is non-critical
      } finally {
        setLoading(false)
      }
    }

    completeStep()
  }, [stepId, addTokens])

  return { completed, loading, tokensEarned }
}
