'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMarketStatus } from '@/lib/market/hours'

export function MarketHoursBanner() {
  const wasDismissed = typeof window !== 'undefined' && sessionStorage.getItem('market-banner-dismissed')
  const initialStatus = wasDismissed ? null : getMarketStatus()
  const [status] = useState(initialStatus)
  const [dismissed, setDismissed] = useState(!!wasDismissed)

  if (!status || status.isOpen || dismissed) return null

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2 text-sm">
      <span className="text-muted-foreground">{status.message}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 min-h-[44px] min-w-[44px]"
        onClick={() => {
          setDismissed(true)
          sessionStorage.setItem('market-banner-dismissed', 'true')
        }}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
