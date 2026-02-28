import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { PortfolioSnapshot } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const rawDays = parseInt(searchParams.get('days') ?? '30', 10)
    const days = Math.min(Math.max(isNaN(rawDays) ? 30 : rawDays, 1), 365)

    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .gte('snapshot_date', sinceStr)
      .order('snapshot_date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
    }

    return NextResponse.json({ data: (data ?? []) as PortfolioSnapshot[] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
