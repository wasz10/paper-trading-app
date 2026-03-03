import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { WatchlistItem } from '@/types/watchlist'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: items } = await supabase
      .from('user_watchlists')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    return NextResponse.json({ data: (items ?? []) as WatchlistItem[] })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
