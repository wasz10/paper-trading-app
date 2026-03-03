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
      // Mark specific notifications as read (capped at 100)
      const validIds = ids.filter((id): id is string => typeof id === 'string').slice(0, 100)
      if (validIds.length === 0) {
        return NextResponse.json({ data: { ok: true } })
      }
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', validIds)
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
