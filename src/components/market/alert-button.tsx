'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

interface AlertButtonProps {
  ticker: string
  currentPrice: number // dollars
}

export function AlertButton({ ticker, currentPrice }: AlertButtonProps) {
  const [open, setOpen] = useState(false)
  const [condition, setCondition] = useState<'above' | 'below'>('above')
  const [targetPrice, setTargetPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen)
    if (isOpen) {
      setTargetPrice(currentPrice.toFixed(2))
      setCondition('above')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(targetPrice)
    if (isNaN(price) || price <= 0) {
      toast.error('Enter a valid price')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/alerts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker,
          condition,
          targetPriceCents: Math.round(price * 100),
        }),
      })
      const json = await res.json()
      if (json.error) {
        toast.error(json.error)
      } else {
        toast.success(`Alert set: ${ticker} ${condition} $${price.toFixed(2)}`)
        setOpen(false)
      }
    } catch {
      toast.error('Failed to create alert')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <div className="group relative">
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10" aria-label="Set price alert">
            <Bell className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border opacity-0 group-hover:opacity-100 transition-opacity">
          Set Price Alert
        </span>
      </div>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Price Alert — {ticker}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">
              Current price: ${currentPrice.toFixed(2)}
            </Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={condition === 'above' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setCondition('above')}
            >
              Above
            </Button>
            <Button
              type="button"
              variant={condition === 'below' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setCondition('below')}
            >
              Below
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetPrice">Target Price ($)</Label>
            <Input
              id="targetPrice"
              type="number"
              step="0.01"
              min="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Setting Alert...' : 'Set Alert'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
