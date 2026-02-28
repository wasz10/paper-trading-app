'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMarketStatus } from '@/lib/market/hours'

export function MarketHoursBanner() {
  const [status, setStatus] = useState<{ isOpen: boolean; message: string } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem('market-banner-dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }
    setStatus(getMarketStatus())
  }, [])

  if (!status || status.isOpen || dismissed) return null

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2 text-sm">
      <span className="text-muted-foreground">{status.message}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => {
          setDismissed(true)
          sessionStorage.setItem('market-banner-dismissed', 'true')
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
