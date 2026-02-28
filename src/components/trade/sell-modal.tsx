'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTradeStore } from '@/stores/trade-store'
import { usePortfolioStore } from '@/stores/portfolio-store'
import { formatDollars, formatShares } from '@/lib/utils'
import { toast } from 'sonner'

interface SellModalProps {
  ticker: string
  price: number // dollars
  sharesOwned: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SellModal({ ticker, price, sharesOwned, open, onOpenChange }: SellModalProps) {
  const [shares, setShares] = useState('')
  const { executeSell, isExecuting } = useTradeStore()
  const { fetchPortfolio } = usePortfolioStore()

  const sharesToSell = parseFloat(shares) || 0
  const estimatedValue = sharesToSell * price

  async function handleSell() {
    if (sharesToSell <= 0) {
      toast.error('Enter a valid number of shares')
      return
    }
    try {
      await executeSell(ticker, sharesToSell)
      toast.success(`Sold ${formatShares(sharesToSell)} shares of ${ticker}`)
      await fetchPortfolio()
      onOpenChange(false)
      setShares('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Trade failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell {ticker}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current price: {formatDollars(price)} · You own: {formatShares(sharesOwned)} shares
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Shares to sell</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0"
                min="0"
                step="0.000001"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShares(sharesOwned.toString())}
              >
                Sell All
              </Button>
            </div>
          </div>
          {sharesToSell > 0 && (
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive ~{formatDollars(estimatedValue)}
            </p>
          )}
          <Button
            className="w-full"
            variant="destructive"
            onClick={handleSell}
            disabled={isExecuting || sharesToSell <= 0}
          >
            {isExecuting ? 'Selling...' : `Sell ${formatShares(sharesToSell)} shares`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
