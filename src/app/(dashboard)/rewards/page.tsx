'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StreakDisplay } from '@/components/rewards/streak-display'
import { DailyRewardModal } from '@/components/rewards/daily-reward-modal'
import { TokenBalance } from '@/components/rewards/token-balance'
import { WeeklyChallengeList } from '@/components/rewards/weekly-challenge'
import type { ChallengeStatus } from '@/components/rewards/weekly-challenge'
import { useTutorialStep } from '@/hooks/useTutorialStep'
import { useProfileStore } from '@/stores/profile-store'

interface RewardStatus {
  currentStreak: number
  canClaim: boolean
  nextReward: number
  tokenBalance: number
  streakDay: number
}

export default function RewardsPage() {
  // Auto-complete "claim_reward" tutorial step when page is visited
  useTutorialStep('claim_reward')

  const addTokens = useProfileStore((s) => s.addTokens)
  const [status, setStatus] = useState<RewardStatus | null>(null)
  const [challenges, setChallenges] = useState<ChallengeStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showClaimModal, setShowClaimModal] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/rewards/status').then((r) => r.json()),
      fetch('/api/challenges/status').then((r) => r.json()),
    ])
      .then(([rewardJson, challengeJson]) => {
        setStatus(rewardJson.data ?? null)
        setChallenges(challengeJson.data?.challenges ?? [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  if (isLoading || !status) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rewards</h1>

      <TokenBalance balance={status.tokenBalance} />

      <div className="space-y-3">
        <StreakDisplay currentStreak={status.currentStreak} />
        {status.canClaim && (
          <Button onClick={() => setShowClaimModal(true)} className="w-full">
            Claim Daily Reward (+{status.nextReward} tokens)
          </Button>
        )}
        {!status.canClaim && (
          <p className="text-sm text-muted-foreground text-center">
            Come back tomorrow for your next reward!
          </p>
        )}
      </div>

      <WeeklyChallengeList
        challenges={challenges}
        onClaimed={(challengeId, tokens) => {
          setChallenges((prev) =>
            prev.map((ch) =>
              ch.id === challengeId ? { ...ch, claimed: true } : ch
            )
          )
          setStatus({ ...status, tokenBalance: status.tokenBalance + tokens })
          addTokens(tokens)
        }}
      />

      <DailyRewardModal
        open={showClaimModal}
        onOpenChange={setShowClaimModal}
        nextReward={status.nextReward}
        onClaimed={(tokens, newStreak) => {
          setStatus({
            ...status,
            tokenBalance: status.tokenBalance + tokens,
            currentStreak: newStreak,
            canClaim: false,
          })
          addTokens(tokens)
        }}
      />
    </div>
  )
}
