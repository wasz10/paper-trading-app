'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { UserWatchlistGrid } from '@/components/watchlist/user-watchlist-grid'

export default function WatchlistPage() {
  const [count, setCount] = useState(0)
  const [limit, setLimit] = useState(20)

  useEffect(() => {
    // Fetch watchlist count and user profile for limit
    Promise.all([
      fetch('/api/watchlist').then((r) => r.json()),
      fetch('/api/account').then((r) => r.json()),
    ])
      .then(([watchlistJson, accountJson]) => {
        setCount(watchlistJson.data?.length ?? 0)
        const isSub = accountJson.data?.is_subscriber ?? false
        setLimit(isSub ? 50 : 20)
      })
      .catch(() => {
        // Keep defaults
      })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">My Watchlist</h1>
        <Badge variant="secondary">{count} / {limit}</Badge>
      </div>
      <UserWatchlistGrid />
    </div>
  )
}
