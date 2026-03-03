import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  if (process.env.DEV_PANEL_ENABLED !== 'true') {
    return NextResponse.json({ enabled: false })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('cash_balance, token_balance, current_streak, trades_today, display_name')
      .eq('id', user.id)
      .single()

    const { data: tutorial } = await supabase
      .from('tutorial_progress')
      .select('steps_completed, completed_at')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      enabled: true,
      user: {
        id: user.id,
        ...profile,
        tutorial: tutorial ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
