'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StreakDisplay } from '@/components/rewards/streak-display'
import { DailyRewardModal } from '@/components/rewards/daily-reward-modal'
import { TokenBalance } from '@/components/rewards/token-balance'
import { WeeklyChallengeList } from '@/components/rewards/weekly-challenge'

interface RewardStatus {
  currentStreak: number
  canClaim: boolean
  nextReward: number
  tokenBalance: number
  streakDay: number
}

export default function RewardsPage() {
  const [status, setStatus] = useState<RewardStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showClaimModal, setShowClaimModal] = useState(false)

  useEffect(() => {
    fetch('/api/rewards/status')
      .then((res) => res.json())
      .then((json) => {
        setStatus(json.data ?? null)
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

      <WeeklyChallengeList completedIds={[]} />

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
        }}
      />
    </div>
  )
}
