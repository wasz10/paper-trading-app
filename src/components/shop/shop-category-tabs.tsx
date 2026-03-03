'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: 'Themes', value: 'theme' },
  { label: 'Badges', value: 'badge' },
  { label: 'Boosts', value: 'boost' },
  { label: 'Perks', value: 'perk' },
] as const

interface ShopCategoryTabsProps {
  activeCategory: string
  onCategoryChange: (cat: string) => void
}

export function ShopCategoryTabs({ activeCategory, onCategoryChange }: ShopCategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      {CATEGORIES.map((cat) => (
        <Button
          key={cat.value}
          variant={activeCategory === cat.value ? 'default' : 'outline'}
          size="sm"
          className={cn('shrink-0 min-h-[36px]')}
          onClick={() => onCategoryChange(cat.value)}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  )
}
