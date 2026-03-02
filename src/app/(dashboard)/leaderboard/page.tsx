'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table'
import { UserRankCard } from '@/components/leaderboard/user-rank-card'
import type { LeaderboardEntry } from '@/types'

type Period = 'daily' | 'weekly' | 'all-time'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('all-time')

  const fetchLeaderboard = useCallback(async (p: Period) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?period=${p}`)
      const json = await res.json()
      if (json.data) {
        setEntries(json.data)
      }
    } catch {
      // Silently fail — table will show empty state
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard(period)
  }, [period, fetchLeaderboard])

  const currentUserEntry = entries.find((e) => e.is_current_user) ?? null
  const currentUserRank = currentUserEntry
    ? entries.findIndex((e) => e.is_current_user) + 1
    : null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground text-sm">
          See how you stack up against other traders. Rankings update with live prices.
        </p>
      </div>

      <UserRankCard
        entry={currentUserEntry}
        rank={currentUserRank}
        totalTraders={entries.length}
        isLoading={isLoading}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Top Traders</CardTitle>
            <Tabs
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
            >
              <TabsList>
                <TabsTrigger value="daily">Daily</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="all-time">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <LeaderboardTable
            entries={entries}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}
