'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Coins, LogOut } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'
import { useProfileStore } from '@/stores/profile-store'

export function Header() {
  const router = useRouter()
  const displayName = useProfileStore((s) => s.displayName)
  const tokenBalance = useProfileStore((s) => s.tokenBalance)

  async function handleLogout() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : '??'

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-card flex items-center justify-between px-4 md:px-6">
      <div className="md:hidden text-lg font-bold">
        Paper<span className="text-primary">Trade</span>
      </div>
      <div className="hidden md:block text-lg font-semibold">Dashboard</div>

      <div className="flex items-center gap-3">
        {/* Token balance — click to go to rewards */}
        <button
          onClick={() => router.push('/rewards')}
          className="group relative flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Coins className="h-4 w-4 text-yellow-500" />
          <span>{tokenBalance}</span>
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border opacity-0 group-hover:opacity-100 transition-opacity">
            Your Tokens — Earn more daily!
          </span>
        </button>

        {/* Avatar — click to go to settings */}
        <button
          onClick={() => router.push('/settings')}
          className="group relative"
        >
          <Avatar className="h-8 w-8 cursor-pointer">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border opacity-0 group-hover:opacity-100 transition-opacity">
            Profile &amp; Settings
          </span>
        </button>

        {/* Logout button */}
        <div className="group relative">
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
            <LogOut className="h-4 w-4" />
          </Button>
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border opacity-0 group-hover:opacity-100 transition-opacity">
            Sign Out
          </span>
        </div>
      </div>
    </header>
  )
}
