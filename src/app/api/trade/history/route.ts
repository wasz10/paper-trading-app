import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Trade } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const { count } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { data: trades, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
    }

    return NextResponse.json({ data: trades as Trade[], total: count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}
