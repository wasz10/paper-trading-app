import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids } = await request.json()

    if (Array.isArray(ids) && ids.length > 0) {
      // Mark specific notifications as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', ids)
        .eq('user_id', user.id)
    } else {
      // Mark all as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)
    }

    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
