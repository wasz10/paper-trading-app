'use client'

import { useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GoldCrown, DiamondSparkle, FireFlame } from '@/components/ui/badge-frame-svgs'
import { cn } from '@/lib/utils'

interface FramedAvatarProps {
  initials: string
  badgeFrame?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
} as const

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-xl',
} as const

const svgOverlaySizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
} as const

const BADGE_FRAME_STYLES_ID = 'badge-frame-keyframes'

const badgeFrameKeyframes = `
@keyframes badge-shimmer {
  0%, 100% {
    box-shadow: 0 0 4px 1px rgba(103, 232, 249, 0.4);
  }
  50% {
    box-shadow: 0 0 12px 3px rgba(103, 232, 249, 0.8);
  }
}
@keyframes badge-flicker {
  0%, 100% {
    box-shadow: 0 0 4px 1px rgba(249, 115, 22, 0.4);
  }
  33% {
    box-shadow: 0 0 10px 3px rgba(249, 115, 22, 0.8);
  }
  66% {
    box-shadow: 0 0 6px 2px rgba(249, 115, 22, 0.6);
  }
}
.badge-frame-shimmer {
  animation: badge-shimmer 2s ease-in-out infinite;
}
.badge-frame-flicker {
  animation: badge-flicker 1.5s ease-in-out infinite;
}
`

function getRingClasses(badgeFrame: string | null | undefined): string {
  if (!badgeFrame) return ''

  // Base badge determines ring color
  if (badgeFrame.startsWith('badge_gold')) {
    const isAnimated = badgeFrame === 'badge_gold_animated'
    return cn('ring-2 ring-yellow-500', isAnimated && 'animate-pulse')
  }
  if (badgeFrame.startsWith('badge_diamond')) {
    const isAnimated = badgeFrame === 'badge_diamond_animated'
    return cn('ring-2 ring-cyan-300', isAnimated && 'badge-frame-shimmer')
  }
  if (badgeFrame.startsWith('badge_fire')) {
    const isAnimated = badgeFrame === 'badge_fire_animated'
    return cn('ring-2 ring-orange-500', isAnimated && 'badge-frame-flicker')
  }

  return ''
}

function getSvgOverlay(badgeFrame: string | null | undefined, size: 'sm' | 'md' | 'lg') {
  if (!badgeFrame) return null

  const svgSize = svgOverlaySizes[size]
  const isSvgOrAnimated = badgeFrame.endsWith('_svg') || badgeFrame.endsWith('_animated')
  if (!isSvgOrAnimated) return null

  if (badgeFrame.startsWith('badge_gold')) {
    return (
      <GoldCrown
        className={cn('absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none', svgSize)}
      />
    )
  }
  if (badgeFrame.startsWith('badge_diamond')) {
    return (
      <DiamondSparkle
        className={cn('absolute -top-1 -right-1 z-10 pointer-events-none', svgSize)}
      />
    )
  }
  if (badgeFrame.startsWith('badge_fire')) {
    return (
      <FireFlame
        className={cn('absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none', svgSize)}
      />
    )
  }

  return null
}

export function FramedAvatar({ initials, badgeFrame, size = 'md', className }: FramedAvatarProps) {
  const ringClasses = getRingClasses(badgeFrame)
  const svgOverlay = getSvgOverlay(badgeFrame, size)

  // Inject keyframe styles once into the document head
  useEffect(() => {
    if (document.getElementById(BADGE_FRAME_STYLES_ID)) return
    const style = document.createElement('style')
    style.id = BADGE_FRAME_STYLES_ID
    style.textContent = badgeFrameKeyframes
    document.head.appendChild(style)
  }, [])

  return (
    <div className={cn('relative inline-flex', className)}>
      <Avatar className={cn(sizeClasses[size], 'cursor-pointer', ringClasses)}>
        <AvatarFallback className={textSizeClasses[size]}>{initials}</AvatarFallback>
      </Avatar>
      {svgOverlay}
    </div>
  )
}
