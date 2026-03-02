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

interface BuyModalProps {
  ticker: string
  price: number // dollars
  cashBalance: number // cents
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BuyModal({ ticker, price, cashBalance, open, onOpenChange, onSuccess }: BuyModalProps) {
  const [mode, setMode] = useState<'dollars' | 'shares'>('dollars')
  const [amount, setAmount] = useState('')
  const [completedTrade, setCompletedTrade] = useState<Trade | null>(null)
  const { executeBuy, isExecuting } = useTradeStore()
  const { fetchPortfolio } = usePortfolioStore()

  // Dollars mode calculations
  const dollarAmount = mode === 'dollars' ? (parseFloat(amount) || 0) : 0
  const sharesInput = mode === 'shares' ? (parseFloat(amount) || 0) : 0

  // Compute amountCents regardless of mode (needed for API call and validation)
  const amountCents = mode === 'dollars'
    ? Math.round(dollarAmount * 100)
    : Math.round(sharesInput * price * 100)

  // Estimated display values
  const estimatedShares = mode === 'dollars' && price > 0
    ? Math.floor((dollarAmount / price) * 1e6) / 1e6
    : 0
  const estimatedCost = mode === 'shares' ? sharesInput * price : 0

  const validationError = amount
    ? amountCents < 100
      ? 'Minimum trade is $1.00'
      : amountCents > cashBalance
        ? 'Insufficient funds'
        : null
    : null

  async function handleBuy() {
    if (validationError || amountCents < 100) return
    try {
      const trade = await executeBuy(ticker, amountCents)
      if (trade) {
        setCompletedTrade(trade)
        await fetchPortfolio()
      }
    } catch {
      // trade store handles errors via throw, toast shown by caller or store
    }
  }

  function handleClose() {
    if (completedTrade) onSuccess?.()
    setAmount('')
    setMode('dollars')
    setCompletedTrade(null)
    onOpenChange(false)
  }

  function handleMax() {
    if (mode === 'dollars') {
      setAmount((cashBalance / 100).toFixed(2))
    } else {
      if (price <= 0) { setAmount('0'); return }
      let maxShares = Math.floor((cashBalance / 100 / price) * 1e6) / 1e6
      // Guard against FP rounding pushing cost above balance
      if (Math.round(maxShares * price * 100) > cashBalance) {
        maxShares = Math.floor(((cashBalance - 1) / 100 / price) * 1e6) / 1e6
      }
      setAmount(maxShares > 0 ? maxShares.toString() : '0')
    }
  }

  // Should we show the estimate line?
  const showEstimate = mode === 'dollars'
    ? dollarAmount >= 1 && !validationError
    : sharesInput > 0 && !validationError

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy {ticker}</DialogTitle>
        </DialogHeader>

        {completedTrade ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <p className="font-semibold">Trade Executed</p>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares</span>
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
              <span className="text-muted-foreground">Available Cash</span>
              <span>{formatCurrency(cashBalance)}</span>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-lg border p-0.5">
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === 'dollars' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => { setMode('dollars'); setAmount('') }}
              >
                Dollars
              </button>
              <button
                type="button"
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  mode === 'shares' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => { setMode('shares'); setAmount('') }}
              >
                Shares
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="buy-amount" className="text-sm font-medium">
                {mode === 'dollars' ? 'Dollar Amount' : 'Number of Shares'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  {mode === 'dollars' && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  )}
                  <Input
                    id="buy-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder={mode === 'dollars' ? '0.00' : '0'}
                    value={amount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = v.split('.')
                      if (parts.length > 2) return
                      const maxDecimals = mode === 'dollars' ? 2 : 6
                      if (parts[1] && parts[1].length > maxDecimals) return
                      setAmount(v)
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
                {mode === 'dollars'
                  ? `≈ ${formatShares(estimatedShares)} shares`
                  : `≈ ${formatDollars(estimatedCost)}`
                }
              </p>
            )}

            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}

            <Button
              className="w-full"
              onClick={handleBuy}
              disabled={isExecuting || amountCents < 100 || !!validationError}
            >
              {isExecuting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Buying...</>
              ) : (
                'Confirm Buy'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
