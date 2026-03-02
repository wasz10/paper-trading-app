'use client'

import { useEffect, useState } from 'react'
import { Coins } from 'lucide-react'

interface TutorialToastProps {
  tokens: number
  completed: number
  total: number
  onClose: () => void
}

export function TutorialToast({ tokens, completed, total, onClose }: TutorialToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Slide in
    const showTimer = setTimeout(() => setVisible(true), 50)

    // Auto-dismiss after 4 seconds
    const hideTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 4000)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [onClose])

  return (
    <div
      className={`fixed top-4 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-card px-4 py-3 shadow-lg">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
          <Coins className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="text-sm font-medium">Quest complete!</p>
          <p className="text-xs text-muted-foreground">
            +{tokens} tokens — {completed}/{total} done
          </p>
        </div>
      </div>
    </div>
  )
}
