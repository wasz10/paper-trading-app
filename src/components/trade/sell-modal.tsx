'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTradeStore } from '@/stores/trade-store'
import { usePortfolioStore } from '@/stores/portfolio-store'
import { formatCurrency, formatDollars, formatShares } from '@/lib/utils'
import { Loader2, CheckCircle2 } from 'lucide-react'
import type { Trade } from '@/types'

interface SellModalProps {
  ticker: string
  price: number // dollars
  sharesOwned: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SellModal({ ticker, price, sharesOwned, open, onOpenChange, onSuccess }: SellModalProps) {
  const [shares, setShares] = useState('')
  const [completedTrade, setCompletedTrade] = useState<Trade | null>(null)
  const { executeSell, isExecuting } = useTradeStore()
  const { fetchPortfolio } = usePortfolioStore()

  const sharesToSell = parseFloat(shares) || 0
  const estimatedValue = sharesToSell * price

  const validationError = shares
    ? sharesToSell <= 0
      ? 'Enter a valid number of shares'
      : sharesToSell > sharesOwned
        ? `You only own ${formatShares(sharesOwned)} shares`
        : null
    : null

  async function handleSell() {
    if (validationError || sharesToSell <= 0) return
    try {
      const trade = await executeSell(ticker, sharesToSell)
      if (trade) {
        setCompletedTrade(trade)
        await fetchPortfolio()
      }
    } catch {
      // trade store handles errors via throw
    }
  }

  function handleClose() {
    if (completedTrade) onSuccess?.()
    setShares('')
    setCompletedTrade(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sell {ticker}</DialogTitle>
        </DialogHeader>

        {completedTrade ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="font-semibold">Trade Executed</p>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares Sold</span>
                <span>{formatShares(completedTrade.shares)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span>{formatCurrency(completedTrade.price_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(completedTrade.total_cents)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={`/trade/${completedTrade.id}`}>
                <Button variant="outline" className="w-full">View AI Analysis</Button>
              </Link>
              <Button onClick={handleClose} className="w-full">Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Price</span>
              <span className="font-semibold">{formatDollars(price)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shares Owned</span>
              <span>{formatShares(sharesOwned)} ({formatDollars(sharesOwned * price)})</span>
            </div>

            <div className="space-y-2">
              <label htmlFor="sell-shares" className="text-sm font-medium">
                Shares to Sell
              </label>
              <div className="flex gap-2">
                <Input
                  id="sell-shares"
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={shares}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9.]/g, '')
                    const parts = v.split('.')
                    if (parts.length > 2) return
                    if (parts[1] && parts[1].length > 6) return
                    setShares(v)
                  }}
                  autoFocus
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setShares(sharesOwned.toString())}
                >
                  Sell All
                </Button>
              </div>
            </div>

            {sharesToSell > 0 && !validationError && (
              <p className="text-sm text-muted-foreground">
                ≈ {formatDollars(estimatedValue)}
              </p>
            )}

            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}

            <Button
              className="w-full"
              variant="destructive"
              onClick={handleSell}
              disabled={isExecuting || sharesToSell <= 0 || !!validationError}
            >
              {isExecuting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Selling...</>
              ) : (
                'Confirm Sell'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
