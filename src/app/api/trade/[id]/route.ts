import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: trade, error } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    return NextResponse.json({ data: trade })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch trade' }, { status: 500 })
  }
}
