'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Loader2, Coins, DollarSign, RotateCcw, Camera, GraduationCap, Flame } from 'lucide-react'

interface DevStatus {
  enabled: boolean
  user?: {
    id: string
    cash_balance: number
    token_balance: number
    current_streak: number
    trades_today: number
    display_name: string | null
    tutorial: {
      steps_completed: Record<string, boolean>
      completed_at: string | null
    } | null
  }
}

export default function DevPage() {
  const [status, setStatus] = useState<DevStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [tokenInput, setTokenInput] = useState('')
  const [cashInput, setCashInput] = useState('')
  const [streakInput, setStreakInput] = useState('')
  const [showResetDialog, setShowResetDialog] = useState(false)

  // Loading states
  const [savingTokens, setSavingTokens] = useState(false)
  const [savingCash, setSavingCash] = useState(false)
  const [savingStreak, setSavingStreak] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [snapshotting, setSnapshotting] = useState(false)
  const [tutorialLoading, setTutorialLoading] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/dev/status')
      const json = await res.json()
      setStatus(json)
      if (json.user) {
        setTokenInput(String(json.user.token_balance ?? 0))
        setCashInput(String((json.user.cash_balance ?? 0) / 100))
        setStreakInput(String(json.user.current_streak ?? 0))
      }
    } catch {
      setStatus({ enabled: false })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  async function postDev(endpoint: string, body?: object) {
    const res = await fetch(`/api/dev/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return res.json()
  }

  async function handleSetTokens() {
    setSavingTokens(true)
    try {
      const json = await postDev('tokens', { balance: Number(tokenInput) })
      if (json.ok) {
        toast.success(`Tokens set to ${tokenInput}`)
        fetchStatus()
      } else {
        toast.error(json.error)
      }
    } catch {
      toast.error('Failed')
    } finally {
      setSavingTokens(false)
    }
  }

  async function handleSetCash() {
    setSavingCash(true)
    try {
      const cents = Math.round(Number(cashInput) * 100)
      const json = await postDev('cash', { balanceCents: cents })
      if (json.ok) {
        toast.success(`Cash set to $${cashInput}`)
        fetchStatus()
      } else {
        toast.error(json.error)
      }
    } catch {
      toast.error('Failed')
    } finally {
      setSavingCash(false)
    }
  }

  async function handleSetStreak() {
    setSavingStreak(true)
    try {
      const json = await postDev('streak', { streak: Number(streakInput) })
      if (json.ok) {
        toast.success(`Streak set to ${streakInput}`)
        fetchStatus()
      } else {
        toast.error(json.error)
      }
    } catch {
      toast.error('Failed')
    } finally {
      setSavingStreak(false)
    }
  }

  async function handleReset() {
    setResetting(true)
    try {
      const json = await postDev('reset')
      if (json.ok) {
        toast.success('Account reset to defaults')
        setShowResetDialog(false)
        fetchStatus()
      } else {
        toast.error(json.error)
      }
    } catch {
      toast.error('Failed')
    } finally {
      setResetting(false)
    }
  }

  async function handleSnapshot() {
    setSnapshotting(true)
    try {
      const json = await postDev('snapshot')
      if (json.ok) {
        const s = json.snapshot
        toast.success(`Snapshot: $${(s.total_value_cents / 100).toFixed(2)}`)
      } else {
        toast.error(json.error)
      }
    } catch {
      toast.error('Failed')
    } finally {
      setSnapshotting(false)
    }
  }

  async function handleTutorial(action: 'complete' | 'reset') {
    setTutorialLoading(true)
    try {
      const json = await postDev('tutorial', { action })
      if (json.ok) {
        toast.success(action === 'complete' ? 'Tutorial completed' : 'Tutorial reset')
        fetchStatus()
      } else {
        toast.error(json.error)
      }
    } catch {
      toast.error('Failed')
    } finally {
      setTutorialLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!status?.enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold">Not Found</h1>
        <p className="text-muted-foreground mt-2">This page doesn&apos;t exist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Developer Panel</h1>
        <p className="text-muted-foreground text-sm">
          State manipulation tools — {status.user?.display_name ?? 'Unknown'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Token Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4" /> Token Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <Button onClick={handleSetTokens} disabled={savingTokens} size="sm">
                {savingTokens ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cash Balance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Cash Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                placeholder="Dollars"
              />
              <Button onClick={handleSetCash} disabled={savingCash} size="sm">
                {savingCash ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4" /> Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                value={streakInput}
                onChange={(e) => setStreakInput(e.target.value)}
              />
              <Button onClick={handleSetStreak} disabled={savingStreak} size="sm">
                {savingStreak ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Snapshot */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" /> Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSnapshot} disabled={snapshotting} className="w-full" size="sm">
              {snapshotting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {snapshotting ? 'Taking...' : 'Take Snapshot Now'}
            </Button>
          </CardContent>
        </Card>

        {/* Tutorial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Tutorial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                onClick={() => handleTutorial('complete')}
                disabled={tutorialLoading}
                size="sm"
                className="flex-1"
              >
                Complete All
              </Button>
              <Button
                onClick={() => handleTutorial('reset')}
                disabled={tutorialLoading}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reset Account */}
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <RotateCcw className="h-4 w-4" /> Reset Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => setShowResetDialog(true)}
              size="sm"
              className="w-full"
            >
              Reset to Defaults
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Account</DialogTitle>
            <DialogDescription>
              This will delete all trades, holdings, rewards, and tutorial progress.
              Cash will be reset to $10,000 and tokens to 0.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {resetting ? 'Resetting...' : 'Reset'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
