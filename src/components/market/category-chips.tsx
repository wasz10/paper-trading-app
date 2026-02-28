'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { STOCK_CATEGORIES } from '@/lib/market/watchlists'

interface CategoryChipsProps {
  selected: string
  onSelect: (id: string) => void
}

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
      {STOCK_CATEGORIES.map((cat) => (
        <Button
          key={cat.id}
          variant={selected === cat.id ? 'default' : 'outline'}
          size="sm"
          className={cn('shrink-0 min-h-[36px]', selected === cat.id && 'pointer-events-none')}
          onClick={() => onSelect(cat.id)}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  )
}
