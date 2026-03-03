'use client'

import { useEffect, useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { ShopItemCard } from '@/components/shop/shop-item-card'
import { ShopCategoryTabs } from '@/components/shop/shop-category-tabs'
import { PurchaseDialog } from '@/components/shop/purchase-dialog'
import { useProfileStore } from '@/stores/profile-store'
import { toast } from 'sonner'
import type { ShopItem, ShopItemWithOwnership } from '@/types/shop'

export default function ShopPage() {
  const refetchBalance = useProfileStore((s) => s.refetchBalance)
  const activeTheme = useProfileStore((s) => s.activeTheme)
  const activeBadgeFrame = useProfileStore((s) => s.activeBadgeFrame)
  const setActiveTheme = useProfileStore((s) => s.setActiveTheme)
  const setActiveBadgeFrame = useProfileStore((s) => s.setActiveBadgeFrame)
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
      if (!res.ok) throw new Error('Failed to load shop items')
      const json = await res.json()
      if (json.data) {
        setItems(json.data)
        setBalance(json.balance)
      } else if (json.error) {
        toast.error(json.error)
      }
    } catch {
      toast.error('Failed to load shop items')
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
        setDialogOpen(false)
        setSelectedItem(null)
        toast.success(`Purchased ${selectedItem.name}!`)
        await refetchBalance()
        await fetchItems()
      } else if (json.error) {
        toast.error(json.error)
      }
    } catch {
      toast.error('Purchase failed, please try again')
    } finally {
      setIsPurchasing(false)
    }
  }

  const handleApplyItem = async (item: ShopItem) => {
    if (item.category === 'theme') {
      const themeId = item.id.replace('theme_', '')
      try {
        const res = await fetch('/api/profile/theme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: themeId }),
        })
        const json = await res.json()
        if (json.data?.success) {
          setActiveTheme(themeId)
          document.documentElement.setAttribute('data-theme', themeId)
          toast.success(`Applied ${item.name}`)
        } else if (json.error) {
          toast.error(json.error)
        }
      } catch {
        toast.error('Failed to apply theme')
      }
    } else if (item.category === 'badge') {
      try {
        const res = await fetch('/api/profile/badge-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ badgeFrame: item.id }),
        })
        const json = await res.json()
        if (json.data?.success) {
          setActiveBadgeFrame(item.id)
          toast.success(`Applied ${item.name}`)
        } else if (json.error) {
          toast.error(json.error)
        }
      } catch {
        toast.error('Failed to apply badge frame')
      }
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
              onApply={handleApplyItem}
              disabled={balance < item.price && !item.owned}
              activeTheme={activeTheme}
              activeBadgeFrame={activeBadgeFrame}
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
