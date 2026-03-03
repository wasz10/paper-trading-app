import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TICKER_REGEX = /^[A-Z0-9.\-]{1,10}$/
const FREE_ALERT_LIMIT = 5
const SUB_ALERT_LIMIT = 15

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticker, condition, targetPriceCents } = await request.json()

    if (!ticker || !TICKER_REGEX.test(ticker)) {
      return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
    }
    if (!['above', 'below'].includes(condition)) {
      return NextResponse.json({ error: 'Invalid condition' }, { status: 400 })
    }
    if (!targetPriceCents || targetPriceCents <= 0) {
      return NextResponse.json({ error: 'Invalid target price' }, { status: 400 })
    }

    // Check alert limit
    const { data: profile } = await supabase.from('users').select('is_subscriber').eq('id', user.id).single()
    const limit = profile?.is_subscriber ? SUB_ALERT_LIMIT : FREE_ALERT_LIMIT

    const { count } = await supabase
      .from('price_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: `Maximum ${limit} active alerts` }, { status: 400 })
    }

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: user.id,
        ticker,
        condition,
        target_price_cents: targetPriceCents,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    return NextResponse.json({ data: alert })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
