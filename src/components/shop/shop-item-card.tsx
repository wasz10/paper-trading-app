'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ShopItem, ShopItemWithOwnership } from '@/types/shop'

interface ShopItemCardProps {
  item: ShopItemWithOwnership
  onPurchase: (item: ShopItem) => void
  disabled?: boolean
}

export function ShopItemCard({ item, onPurchase, disabled }: ShopItemCardProps) {
  const isDisabled = disabled || item.owned

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
        <span className="text-4xl" role="img" aria-label={item.name}>
          {item.icon}
        </span>
        <div className="space-y-1">
          <h3 className="font-semibold leading-tight">{item.name}</h3>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {item.owned ? (
            <Badge variant="secondary">Owned</Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <span aria-hidden="true">🪙</span> {item.price}
            </Badge>
          )}
        </div>
        <Button
          onClick={() => onPurchase(item)}
          disabled={isDisabled}
          className={cn('w-full min-h-[44px]')}
          size="sm"
        >
          {item.owned ? 'Owned' : 'Buy'}
        </Button>
      </CardContent>
    </Card>
  )
}
