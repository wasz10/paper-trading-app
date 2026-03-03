'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export interface ChallengeStatus {
  id: string
  title: string
  description: string
  reward: number
  target: number
  progress: number
  completed: boolean
  claimed: boolean
}

interface WeeklyChallengeListProps {
  challenges: ChallengeStatus[]
  onClaimed?: (challengeId: string, tokens: number) => void
}

export function WeeklyChallengeList({ challenges, onClaimed }: WeeklyChallengeListProps) {
  const [claimingId, setClaimingId] = useState<string | null>(null)

  async function handleClaim(challengeId: string) {
    setClaimingId(challengeId)
    try {
      const res = await fetch('/api/challenges/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to claim')
        return
      }
      toast.success(`+${json.data.tokensEarned} tokens!`)
      onClaimed?.(challengeId, json.data.tokensEarned)
    } catch {
      toast.error('Failed to claim reward')
    } finally {
      setClaimingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Weekly Challenges</h3>
      {challenges.map((ch) => {
        const progressPercent = ch.target > 0 ? Math.round((ch.progress / ch.target) * 100) : 0
        return (
          <Card key={ch.id} className={ch.claimed ? 'opacity-60' : ''}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{ch.title}</p>
                  <p className="text-sm text-muted-foreground">{ch.description}</p>
                </div>
                {ch.claimed ? (
                  <Badge variant="secondary" className="shrink-0">Claimed</Badge>
                ) : ch.completed ? (
                  <Button
                    size="sm"
                    onClick={() => handleClaim(ch.id)}
                    disabled={claimingId === ch.id}
                  >
                    {claimingId === ch.id ? 'Claiming...' : `Claim +${ch.reward}`}
                  </Button>
                ) : (
                  <Badge variant="outline" className="shrink-0">+{ch.reward}</Badge>
                )}
              </div>
              {!ch.claimed && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{ch.progress}/{ch.target}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
