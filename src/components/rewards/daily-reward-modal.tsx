'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Coins } from 'lucide-react'
import { toast } from 'sonner'

interface DailyRewardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nextReward: number
  onClaimed: (tokens: number, newStreak: number) => void
}

export function DailyRewardModal({ open, onOpenChange, nextReward, onClaimed }: DailyRewardModalProps) {
  const [isClaiming, setIsClaiming] = useState(false)

  async function handleClaim() {
    setIsClaiming(true)
    try {
      const res = await fetch('/api/rewards/claim', { method: 'POST' })
      const json = await res.json()

      if (json.error) {
        toast.error(json.error)
        return
      }

      toast.success(`Earned ${json.data.tokensEarned} tokens!`)
      onClaimed(json.data.tokensEarned, json.data.newStreak)
      onOpenChange(false)
    } catch {
      toast.error('Failed to claim reward')
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-center">
        <DialogHeader>
          <DialogTitle>Daily Reward</DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Coins className="h-8 w-8 text-yellow-500" />
          </div>
          <div>
            <p className="text-3xl font-bold">+{nextReward}</p>
            <p className="text-sm text-muted-foreground">tokens</p>
          </div>
        </div>
        <Button onClick={handleClaim} disabled={isClaiming} className="w-full">
          {isClaiming ? 'Claiming...' : 'Claim Reward'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
