'use client'

import { Coins } from 'lucide-react'

interface TokenBalanceProps {
  balance: number
}

export function TokenBalance({ balance }: TokenBalanceProps) {
  return (
    <div className="flex items-center gap-2 p-4 rounded-lg bg-card border">
      <Coins className="h-6 w-6 text-yellow-500" />
      <div>
        <p className="text-2xl font-bold">{balance}</p>
        <p className="text-sm text-muted-foreground">tokens</p>
      </div>
    </div>
  )
}
