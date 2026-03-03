import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const TICKER_REGEX = /^[A-Z0-9.\-]{1,10}$/
const FREE_WATCHLIST_LIMIT = 20
const SUB_WATCHLIST_LIMIT = 50

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ticker } = await request.json()

    if (!ticker || !TICKER_REGEX.test(ticker)) {
      return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
    }

    // Check watchlist limit
    const { data: profile } = await supabase
      .from('users')
      .select('is_subscriber')
      .eq('id', user.id)
      .single()

    const limit = profile?.is_subscriber ? SUB_WATCHLIST_LIMIT : FREE_WATCHLIST_LIMIT

    const { count } = await supabase
      .from('user_watchlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        { error: `Watchlist full (${limit} max)` },
        { status: 400 }
      )
    }

    const { data: item, error } = await supabase
      .from('user_watchlists')
      .insert({ user_id: user.id, ticker })
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation (already in watchlist)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Already in watchlist' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 })
    }

    return NextResponse.json({ data: item })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
