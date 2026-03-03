'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { WatchlistItem } from '@/types/watchlist'

interface WatchlistButtonProps {
  ticker: string
}

export function WatchlistButton({ ticker }: WatchlistButtonProps) {
  const [isInWatchlist, setIsInWatchlist] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/watchlist', { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        const items: WatchlistItem[] = json.data ?? []
        setIsInWatchlist(items.some((item) => item.ticker === ticker))
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setIsLoading(false)
      })
    return () => controller.abort()
  }, [ticker])

  async function toggleWatchlist() {
    const wasInWatchlist = isInWatchlist

    // Optimistic update
    setIsInWatchlist(!wasInWatchlist)

    try {
      const endpoint = wasInWatchlist ? '/api/watchlist/remove' : '/api/watchlist/add'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })
      const json = await res.json()

      if (json.error) {
        // Revert optimistic update
        setIsInWatchlist(wasInWatchlist)
        toast.error(json.error)
      } else {
        toast.success(wasInWatchlist ? `${ticker} removed from watchlist` : `${ticker} added to watchlist`)
      }
    } catch {
      // Revert optimistic update
      setIsInWatchlist(wasInWatchlist)
      toast.error('Failed to update watchlist')
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-10 w-10 min-w-[44px] min-h-[44px]"
      onClick={toggleWatchlist}
      disabled={isLoading}
      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <Star
        className={cn(
          'h-4 w-4 transition-colors',
          isInWatchlist && 'fill-yellow-400 text-yellow-400'
        )}
      />
    </Button>
  )
}
