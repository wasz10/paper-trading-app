import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  if (process.env.DEV_PANEL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Dev panel disabled' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { streak } = await request.json()
    if (typeof streak !== 'number' || streak < 0) {
      return NextResponse.json({ error: 'Invalid streak' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('users')
      .update({ current_streak: streak })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, current_streak: streak })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
