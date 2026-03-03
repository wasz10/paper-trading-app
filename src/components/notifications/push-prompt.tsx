'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, X } from 'lucide-react'

const DISMISS_KEY = 'push-prompt-dismissed'
const DISMISS_DAYS = 7

export function PushPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if push isn't supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Don't show if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) return // Already subscribed

        // Don't show if recently dismissed
        const dismissed = localStorage.getItem(DISMISS_KEY)
        if (dismissed) {
          const dismissedAt = parseInt(dismissed, 10)
          if (Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000) return
        }

        // Don't show if permission already denied
        if (Notification.permission === 'denied') return

        setShow(true)
      })
    })
  }, [])

  async function handleEnable() {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setShow(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setShow(false)
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      })

      const subJson = subscription.toJSON()
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        }),
      })

      setShow(false)
    } catch {
      setShow(false)
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="mx-4 md:mx-6 mb-4 flex items-center gap-3 rounded-lg border bg-card p-3 text-sm">
      <Bell className="h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1 text-muted-foreground">
        Enable notifications for price alerts and order fills.
      </p>
      <Button size="sm" variant="default" onClick={handleEnable}>
        Enable
      </Button>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
