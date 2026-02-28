'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTradeStore } from '@/stores/trade-store'
import { usePortfolioStore } from '@/stores/portfolio-store'
import { formatDollars, formatShares } from '@/lib/utils'
import { toast } from 'sonner'

interface BuyModalProps {
  ticker: string
  price: number // dollars
  cashBalance: number // cents
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BuyModal({ ticker, price, cashBalance, open, onOpenChange }: BuyModalProps) {
  const [amount, setAmount] = useState('')
  const { executeBuy, isExecuting } = useTradeStore()
  const { fetchPortfolio } = usePortfolioStore()

  const dollarAmount = parseFloat(amount) || 0
  const amountCents = Math.round(dollarAmount * 100)
  const estimatedShares = price > 0 ? dollarAmount / price : 0

  async function handleBuy() {
    if (amountCents < 100) {
      toast.error('Minimum trade is $1.00')
      return
    }
    try {
      await executeBuy(ticker, amountCents)
      toast.success(`Bought ${formatDollars(dollarAmount)} of ${ticker}`)
      await fetchPortfolio()
      onOpenChange(false)
      setAmount('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Trade failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy {ticker}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Current price: {formatDollars(price)}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dollar amount</label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAmount((cashBalance / 100).toFixed(2))}
              >
                Max
              </Button>
            </div>
          </div>
          {dollarAmount > 0 && (
            <p className="text-sm text-muted-foreground">
              You&apos;ll get ~{formatShares(estimatedShares)} shares
            </p>
          )}
          <Button
            className="w-full"
            onClick={handleBuy}
            disabled={isExecuting || amountCents < 100}
          >
            {isExecuting ? 'Buying...' : `Buy ${formatDollars(dollarAmount)} of ${ticker}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
