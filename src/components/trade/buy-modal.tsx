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

interface BuyModalProps {
  ticker: string
  price: number // dollars
  cashBalance: number // cents
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BuyModal({ ticker, price, cashBalance, open, onOpenChange, onSuccess }: BuyModalProps) {
  const [amount, setAmount] = useState('')
  const [completedTrade, setCompletedTrade] = useState<Trade | null>(null)
  const { executeBuy, isExecuting } = useTradeStore()
  const { fetchPortfolio } = usePortfolioStore()

  const dollarAmount = parseFloat(amount) || 0
  const amountCents = Math.round(dollarAmount * 100)
  const estimatedShares = price > 0
    ? Math.floor((dollarAmount / price) * 1e6) / 1e6
    : 0

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
    setCompletedTrade(null)
    onOpenChange(false)
  }

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

            <div className="space-y-2">
              <label htmlFor="buy-amount" className="text-sm font-medium">
                Dollar Amount
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    id="buy-amount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, '')
                      const parts = v.split('.')
                      if (parts.length > 2) return
                      if (parts[1] && parts[1].length > 2) return
                      setAmount(v)
                    }}
                    className="pl-7"
                    autoFocus
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => setAmount((cashBalance / 100).toFixed(2))}
                >
                  Max
                </Button>
              </div>
            </div>

            {dollarAmount >= 1 && !validationError && (
              <p className="text-sm text-muted-foreground">
                ≈ {formatShares(estimatedShares)} shares
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
