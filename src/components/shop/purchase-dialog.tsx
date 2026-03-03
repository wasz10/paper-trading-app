'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ShopItem } from '@/types/shop'

interface PurchaseDialogProps {
  item: ShopItem | null
  balance: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isPurchasing: boolean
}

export function PurchaseDialog({
  item,
  balance,
  open,
  onOpenChange,
  onConfirm,
  isPurchasing,
}: PurchaseDialogProps) {
  if (!item) return null

  const canAfford = balance >= item.price
  const balanceAfter = balance - item.price

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            Are you sure you want to buy this item?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-4">
          <span className="text-5xl" role="img" aria-label={item.name}>
            {item.icon}
          </span>
          <h3 className="text-lg font-semibold">{item.name}</h3>
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">🪙 {item.price}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your balance</span>
              <span className="font-medium">🪙 {balance}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-muted-foreground">After purchase</span>
              <span className={canAfford ? 'font-medium' : 'font-medium text-destructive'}>
                🪙 {canAfford ? balanceAfter : 'Insufficient'}
              </span>
            </div>
          </div>
          {!canAfford && (
            <p className="text-sm text-destructive">
              You need {item.price - balance} more tokens to buy this item.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPurchasing || !canAfford}
            className="min-h-[44px]"
          >
            {isPurchasing ? 'Purchasing...' : 'Confirm Purchase'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
