import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  if (process.env.DEV_PANEL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Dev panel disabled' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Delete from dependent tables
    const tablesToClear = [
      'tutorial_progress',
      'token_transactions',
      'daily_rewards',
      'portfolio_snapshots',
      'leaderboard_cache',
      'trades',
      'holdings',
    ]

    for (const table of tablesToClear) {
      await admin.from(table).delete().eq('user_id', user.id)
    }

    // Reset user to defaults
    await admin
      .from('users')
      .update({
        cash_balance: 1_000_000,
        token_balance: 0,
        current_streak: 0,
        trades_today: 0,
        trades_today_date: null,
        last_login_date: null,
      })
      .eq('id', user.id)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
