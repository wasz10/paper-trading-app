import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@papertrade.app'

let vapidConfigured = false

function ensureVapid() {
  if (vapidConfigured) return true
  if (!vapidPublicKey || !vapidPrivateKey) return false
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
  vapidConfigured = true
  return true
}

interface PushPayload {
  title: string
  body: string
  url?: string
}

/**
 * Send a push notification to all of a user's subscribed devices.
 * Silently fails if VAPID is not configured or user has no subscriptions.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!ensureVapid()) return

  const admin = createAdminClient()
  const { data: subscriptions } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subscriptions || subscriptions.length === 0) return

  const body = JSON.stringify(payload)

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        body
      )
    )
  )

  // Remove invalid/expired subscriptions
  const expiredIds: string[] = []
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      const statusCode = (result.reason as { statusCode?: number })?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        expiredIds.push(subscriptions[i].id)
      }
    }
  })

  if (expiredIds.length > 0) {
    await admin
      .from('push_subscriptions')
      .delete()
      .in('id', expiredIds)
  }
}
