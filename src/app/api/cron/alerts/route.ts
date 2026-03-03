import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuote } from '@/lib/market/yahoo'
import { shouldTriggerAlert } from '@/lib/alerts/engine'
import { sendPushNotification } from '@/lib/notifications/push'
import type { PriceAlert } from '@/types'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()

    // Fetch all active alerts
    const { data: alerts } = await admin
      .from('price_alerts')
      .select('*')
      .eq('status', 'active')

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ data: { checked: 0, triggered: 0 } })
    }

    // Batch-fetch quotes by unique ticker
    const tickers = [...new Set(alerts.map((a) => a.ticker))]
    const quotes = new Map<string, number>()
    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const q = await getQuote(ticker)
          quotes.set(ticker, q.priceCents)
        } catch { /* skip */ }
      })
    )

    let triggeredCount = 0

    for (const alert of alerts as PriceAlert[]) {
      const currentPrice = quotes.get(alert.ticker)
      if (!currentPrice) continue

      if (shouldTriggerAlert(alert, currentPrice)) {
        // Mark alert as triggered
        await admin
          .from('price_alerts')
          .update({
            status: 'triggered',
            triggered_at: new Date().toISOString(),
            triggered_price_cents: currentPrice,
          })
          .eq('id', alert.id)

        // Create in-app notification
        const priceStr = `$${(currentPrice / 100).toFixed(2)}`
        const targetStr = `$${(alert.target_price_cents / 100).toFixed(2)}`
        const condLabel = alert.condition === 'above' ? 'rose above' : 'fell below'

        await admin.from('notifications').insert({
          user_id: alert.user_id,
          type: 'price_alert',
          title: `${alert.ticker} Price Alert`,
          body: `${alert.ticker} ${condLabel} ${targetStr} — now at ${priceStr}`,
          url: `/stock/${alert.ticker}`,
        })

        // Send push notification
        await sendPushNotification(alert.user_id, {
          title: `${alert.ticker} Price Alert`,
          body: `${alert.ticker} ${condLabel} ${targetStr} — now at ${priceStr}`,
          url: `/stock/${alert.ticker}`,
        })

        triggeredCount++
      }
    }

    return NextResponse.json({
      data: { checked: alerts.length, triggered: triggeredCount },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
