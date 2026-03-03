'use client'

import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ShopItemCard } from '@/components/shop/shop-item-card'
import { ShopCategoryTabs } from '@/components/shop/shop-category-tabs'
import { PurchaseDialog } from '@/components/shop/purchase-dialog'
import { useProfileStore } from '@/stores/profile-store'
import type { ShopItem, ShopItemWithOwnership } from '@/types/shop'

export default function ShopPage() {
  const addTokens = useProfileStore((s) => s.addTokens)
  const [items, setItems] = useState<ShopItemWithOwnership[]>([])
  const [balance, setBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/shop/items')
      const json = await res.json()
      if (json.data) {
        setItems(json.data)
        setBalance(json.balance)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filteredItems = category === 'all'
    ? items
    : items.filter((item) => item.category === category)

  const handlePurchaseClick = (item: ShopItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return
    setIsPurchasing(true)

    try {
      const res = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItem.id }),
      })
      const json = await res.json()

      if (json.data?.success) {
        setBalance(json.data.newBalance)
        addTokens(-selectedItem.price)
        setDialogOpen(false)
        setSelectedItem(null)
        // Refresh items to update ownership
        await fetchItems()
      }
    } catch {
      // silently fail
    } finally {
      setIsPurchasing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-9 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Token Shop</h1>
        <div className="flex items-center gap-1.5 text-lg font-semibold">
          <span aria-hidden="true">🪙</span>
          <span>{balance}</span>
        </div>
      </div>

      <ShopCategoryTabs activeCategory={category} onCategoryChange={setCategory} />

      {filteredItems.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">
          No items in this category.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filteredItems.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              onPurchase={handlePurchaseClick}
              disabled={balance < item.price && !item.owned}
            />
          ))}
        </div>
      )}

      <PurchaseDialog
        item={selectedItem}
        balance={balance}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmPurchase}
        isPurchasing={isPurchasing}
      />
    </div>
  )
}
