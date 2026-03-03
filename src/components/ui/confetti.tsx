'use client'

import { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface ConfettiBurstProps {
  trigger: boolean
}

/**
 * Fire a confetti burst when `trigger` transitions to true.
 * Renders nothing — purely a side-effect component.
 */
export function ConfettiBurst({ trigger }: ConfettiBurstProps) {
  useEffect(() => {
    if (!trigger) return

    const duration = 2000
    const end = performance.now() + duration

    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      })

      if (performance.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [trigger])

  return null
}
