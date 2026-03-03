import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getQuote } from '@/lib/market/yahoo'
import { checkDevAccess } from '@/lib/dev-guard'

export async function POST() {
  const access = await checkDevAccess()
  if (!access.allowed) return access.response

  try {
    const supabase = await createClient()

    // Fetch user cash balance
    const { data: profile } = await supabase
      .from('users')
      .select('cash_balance')
      .eq('id', access.userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Fetch holdings
    const { data: holdings } = await supabase
      .from('holdings')
      .select('ticker, shares')
      .eq('user_id', access.userId)

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
      user_id: access.userId,
      total_value_cents: profile.cash_balance + holdingsValueCents,
      cash_cents: profile.cash_balance,
      holdings_value_cents: holdingsValueCents,
      snapshot_date: today,
    }

    const { error } = await supabase
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
