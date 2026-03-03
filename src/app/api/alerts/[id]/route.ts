import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const { error } = await supabase
      .from('price_alerts')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (error) {
      return NextResponse.json({ error: 'Failed to cancel alert' }, { status: 500 })
    }

    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
