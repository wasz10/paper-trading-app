import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuote } from '@/lib/market/yahoo'

export async function POST() {
  if (process.env.DEV_PANEL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Dev panel disabled' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Fetch user cash balance
    const { data: profile } = await admin
      .from('users')
      .select('cash_balance')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch holdings
    const { data: holdings } = await admin
      .from('holdings')
      .select('ticker, shares')
      .eq('user_id', user.id)

    // Calculate holdings value
    let holdingsValueCents = 0
    if (holdings && holdings.length > 0) {
      const quoteResults = await Promise.allSettled(
        holdings.map((h) => getQuote(h.ticker))
      )
      quoteResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          holdingsValueCents += Math.round(
            Number(holdings[i].shares) * result.value.priceCents
          )
        }
      })
    }

    const today = new Date().toISOString().split('T')[0]
    const snapshot = {
      user_id: user.id,
      total_value_cents: profile.cash_balance + holdingsValueCents,
      cash_cents: profile.cash_balance,
      holdings_value_cents: holdingsValueCents,
      snapshot_date: today,
    }

    const { error } = await admin
      .from('portfolio_snapshots')
      .upsert(snapshot, { onConflict: 'user_id,snapshot_date' })

    if (error) {
      return NextResponse.json({ error: 'Snapshot failed' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, snapshot })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
