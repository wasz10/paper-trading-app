'use client'

import { useEffect, useState } from 'react'
import { FramedAvatar } from '@/components/ui/framed-avatar'
import { useProfileStore } from '@/stores/profile-store'
import { cn } from '@/lib/utils'
import type { ShopItemWithOwnership } from '@/types/shop'

export function BadgeFramePicker() {
  const displayName = useProfileStore((s) => s.displayName)
  const activeBadgeFrame = useProfileStore((s) => s.activeBadgeFrame)
  const setActiveBadgeFrame = useProfileStore((s) => s.setActiveBadgeFrame)

  const [ownedBadges, setOwnedBadges] = useState<ShopItemWithOwnership[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : '??'

  useEffect(() => {
    async function fetchOwnedBadges() {
      try {
        const res = await fetch('/api/shop/items')
        const json = await res.json()
        if (json.data) {
          const badges = (json.data as ShopItemWithOwnership[]).filter(
            (item) => item.category === 'badge' && item.owned
          )
          setOwnedBadges(badges)
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchOwnedBadges()
  }, [])

  async function handleApply(badgeFrameId: string | null) {
    setApplying(true)
    try {
      const res = await fetch('/api/profile/badge-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeFrame: badgeFrameId }),
      })
      const json = await res.json()
      if (json.data?.success) {
        setActiveBadgeFrame(badgeFrameId)
      }
    } catch {
      // Silently fail
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Badge Frame</h3>
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (ownedBadges.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Badge Frame</h3>
        <p className="text-sm text-muted-foreground">
          You don&apos;t own any badge frames yet. Visit the Shop to purchase one!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Badge Frame</h3>
      <div className="flex flex-wrap gap-3">
        {/* None option */}
        <button
          onClick={() => handleApply(null)}
          disabled={applying}
          className={cn(
            'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors',
            activeBadgeFrame === null
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <FramedAvatar initials={initials} badgeFrame={null} size="md" />
          <span className="text-xs text-muted-foreground">None</span>
          {activeBadgeFrame === null && (
            <span className="text-[10px] text-primary font-medium">Active</span>
          )}
        </button>

        {/* Owned badge frames */}
        {ownedBadges.map((badge) => (
          <button
            key={badge.id}
            onClick={() => handleApply(badge.id)}
            disabled={applying}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors',
              activeBadgeFrame === badge.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
          >
            <FramedAvatar initials={initials} badgeFrame={badge.id} size="md" />
            <span className="text-xs text-muted-foreground">{badge.name}</span>
            {activeBadgeFrame === badge.id && (
              <span className="text-[10px] text-primary font-medium">Active</span>
            )}
          </button>
        ))}
      </div>
      {applying && (
        <p className="text-xs text-muted-foreground">Applying...</p>
      )}
    </div>
  )
}
