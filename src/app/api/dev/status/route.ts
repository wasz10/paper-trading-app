import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkDevAccess } from '@/lib/dev-guard'

export async function GET() {
  const access = await checkDevAccess()
  if (!access.allowed) return access.response

  try {
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from('users')
      .select('cash_balance, token_balance, current_streak, trades_today, display_name')
      .eq('id', access.userId)
      .single()

    const { data: tutorial } = await supabase
      .from('tutorial_progress')
      .select('steps_completed, completed_at')
      .eq('user_id', access.userId)
      .single()

    return NextResponse.json({
      enabled: true,
      user: {
        ...profile,
        tutorial: tutorial ?? null,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
