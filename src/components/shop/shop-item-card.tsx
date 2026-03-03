'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ShopItem, ShopItemWithOwnership } from '@/types/shop'

interface ShopItemCardProps {
  item: ShopItemWithOwnership
  onPurchase: (item: ShopItem) => void
  onApply?: (item: ShopItem) => void
  disabled?: boolean
  activeTheme?: string | null
  activeBadgeFrame?: string | null
}

export function ShopItemCard({ item, onPurchase, onApply, disabled, activeTheme, activeBadgeFrame }: ShopItemCardProps) {
  const isCosmeticCategory = item.category === 'theme' || item.category === 'badge'

  // Determine if this cosmetic item is currently applied
  let isApplied = false
  if (item.owned && isCosmeticCategory) {
    if (item.category === 'theme') {
      // item.id is like "theme_midnight", activeTheme is like "midnight"
      const themeShortName = item.id.replace('theme_', '')
      isApplied = activeTheme === themeShortName
    } else if (item.category === 'badge') {
      isApplied = activeBadgeFrame === item.id
    }
  }

  const isDisabled = disabled || (item.owned && !isCosmeticCategory) || isApplied

  function handleClick() {
    if (item.owned && isCosmeticCategory && onApply) {
      onApply(item)
    } else if (!item.owned) {
      onPurchase(item)
    }
  }

  function getButtonLabel() {
    if (item.owned && isCosmeticCategory) {
      return isApplied ? 'Applied' : 'Apply'
    }
    if (item.owned) {
      return 'Owned'
    }
    return 'Buy'
  }

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
            <Badge variant={isApplied ? 'default' : 'secondary'}>
              {isApplied ? 'Active' : 'Owned'}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <span aria-hidden="true">🪙</span> {item.price}
            </Badge>
          )}
        </div>
        <Button
          onClick={handleClick}
          disabled={isDisabled}
          className={cn('w-full min-h-[44px]')}
          size="sm"
          variant={item.owned && isCosmeticCategory && !isApplied ? 'outline' : 'default'}
        >
          {getButtonLabel()}
        </Button>
      </CardContent>
    </Card>
  )
}
