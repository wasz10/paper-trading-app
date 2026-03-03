'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Search, ListOrdered, Gift, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Trophy, Settings } from 'lucide-react'

const MAIN_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Search },
  { href: '/orders', label: 'Orders', icon: ListOrdered },
  { href: '/rewards', label: 'Rewards', icon: Gift },
]

const MORE_ITEMS = [
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  const isMoreActive = MORE_ITEMS.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu panel */}
      {showMore && (
        <div className="md:hidden fixed bottom-16 right-2 z-50 w-48 rounded-lg border bg-card shadow-lg p-2 space-y-1">
          {MORE_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowMore(false)}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors min-h-[44px]',
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-card">
        <div className="flex h-full items-center justify-around">
          {MAIN_NAV.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-1 text-xs transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate max-w-[56px]">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 min-w-[48px] min-h-[44px] px-1 text-xs transition-colors',
              isMoreActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
