import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TICKER_REGEX = /^[A-Z0-9.\-]{1,10}$/

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticker } = await request.json()

    if (!ticker || typeof ticker !== 'string' || !TICKER_REGEX.test(ticker)) {
      return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
    }

    await supabase
      .from('user_watchlists')
      .delete()
      .eq('user_id', user.id)
      .eq('ticker', ticker)

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
