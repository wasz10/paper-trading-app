'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedNumberProps {
  value: number
  format?: 'currency' | 'percent' | 'integer'
  className?: string
  duration?: number
}

export function AnimatedNumber({
  value,
  format = 'currency',
  className,
  duration = 500,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [flash, setFlash] = useState<'gain' | 'loss' | null>(null)
  const prevValueRef = useRef(value)
  const rafRef = useRef<number>(0)
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const prev = prevValueRef.current
    if (prev === value) return
    prevValueRef.current = value

    const direction: 'gain' | 'loss' | null = value > prev ? 'gain' : value < prev ? 'loss' : null

    const startTime = performance.now()
    const startVal = prev
    let flashSet = false

    function tick(now: number) {
      // Set flash inside rAF callback (async, not synchronous in effect)
      if (!flashSet) {
        flashSet = true
        if (direction) {
          setFlash(direction)
          clearTimeout(flashTimeoutRef.current)
          flashTimeoutRef.current = setTimeout(() => setFlash(null), 600)
        }
      }

      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startVal + (value - startVal) * eased
      setDisplayValue(current)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(flashTimeoutRef.current)
    }
  }, [value, duration])

  const formatted = formatValue(displayValue, format)

  return (
    <span
      className={cn(
        'transition-colors duration-300',
        flash === 'gain' && 'text-gain',
        flash === 'loss' && 'text-loss',
        className
      )}
    >
      {formatted}
    </span>
  )
}

function formatValue(value: number, format: 'currency' | 'percent' | 'integer'): string {
  switch (format) {
    case 'currency':
      return `$${(value / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'percent':
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
    case 'integer':
      return Math.round(value).toLocaleString()
    default:
      return value.toFixed(2)
  }
}
