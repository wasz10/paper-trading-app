'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Coins, LogOut } from 'lucide-react'
import { signOut } from '@/lib/supabase/auth'

interface HeaderProps {
  displayName?: string | null
  tokenBalance?: number
}

export function Header({ displayName, tokenBalance = 0 }: HeaderProps) {
  const router = useRouter()

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
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span>{tokenBalance}</span>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
