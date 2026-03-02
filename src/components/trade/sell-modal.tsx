'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTradeStore } from '@/stores/trade-store'
import { usePortfolioStore } from '@/stores/portfolio-store'
import { cn, formatCurrency, formatDollars, formatShares } from '@/lib/utils'
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
  const [mode, setMode] = useState<'shares' | 'dollars'>('shares')
  const [input, setInput] = useState('')
  const [completedTrade, setCompletedTrade] = useState<Trade | null>(null)
  const { executeSell, isExecuting } = useTradeStore()
  const { fetchPortfolio } = usePortfolioStore()

  // Compute sharesToSell regardless of mode (needed for API call)
  const sharesToSell = mode === 'shares'
    ? (parseFloat(input) || 0)
    : price > 0
      ? Math.floor(((parseFloat(input) || 0) / price) * 1e6) / 1e6
      : 0

  const dollarInput = mode === 'dollars' ? (parseFloat(input) || 0) : 0
  const estimatedValue = mode === 'shares' ? sharesToSell * price : dollarInput

  const validationError = input
    ? mode === 'dollars' && dollarInput <= 0
      ? 'Enter a valid amount'
      : sharesToSell <= 0
        ? 'Enter a valid amount'
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
    setInput('')
    setMode('shares')
    setCompletedTrade(null)
    onOpenChange(false)
  }

  function handleMax() {
    if (mode === 'shares') {
      setInput(sharesOwned.toString())
    } else {
      // Floor to avoid rounding up past what shares are worth
      setInput((Math.floor(sharesOwned * price * 100) / 100).toFixed(2))
    }
  }

  // Should we show the estimate line?
  const showEstimate = mode === 'shares'
    ? sharesToSell > 0 && !validationError
    : dollarInput > 0 && !validationError

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

            {/* Mode toggle */}
            <div className="flex rounded-lg border p-0.5">
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === 'shares' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => { setMode('shares'); setInput('') }}
              >
                Shares
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === 'dollars' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => { setMode('dollars'); setInput('') }}
              >
                Dollars
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="sell-input" className="text-sm font-medium">
                {mode === 'shares' ? 'Shares to Sell' : 'Dollar Amount'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {mode === 'dollars' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  )}
                  <Input
                    id="sell-input"
                    type="text"
                    inputMode="decimal"
                    placeholder={mode === 'shares' ? '0' : '0.00'}
                    value={input}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = v.split('.')
                      if (parts.length > 2) return
                      const maxDecimals = mode === 'shares' ? 6 : 2
                      if (parts[1] && parts[1].length > maxDecimals) return
                      setInput(v)
                    }}
                    className={mode === 'dollars' ? 'pl-7' : undefined}
                    autoFocus
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  onClick={handleMax}
                >
                  Max
                </Button>
              </div>
            </div>

            {showEstimate && (
              <p className="text-sm text-muted-foreground">
                {mode === 'shares'
                  ? `≈ ${formatDollars(estimatedValue)}`
                  : `≈ ${formatShares(sharesToSell)} shares`
                }
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
