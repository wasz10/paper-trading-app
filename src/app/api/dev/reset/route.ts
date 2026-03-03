import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkDevAccess } from '@/lib/dev-guard'

export async function POST() {
  const access = await checkDevAccess()
  if (!access.allowed) return access.response

  try {
    const supabase = await createClient()

    // Delete from dependent tables (includes Sprint 3 tables)
    const tablesToClear = [
      'user_watchlists',
      'user_purchases',
      'tutorial_progress',
      'token_transactions',
      'daily_rewards',
      'portfolio_snapshots',
      'leaderboard_cache',
      'trades',
      'holdings',
    ]

    for (const table of tablesToClear) {
      await supabase.from(table).delete().eq('user_id', access.userId)
    }

    // Reset user to defaults
    await supabase
      .from('users')
      .update({
        cash_balance: 1_000_000,
        token_balance: 0,
        current_streak: 0,
        trades_today: 0,
        trades_today_date: null,
        last_login_date: null,
      })
      .eq('id', access.userId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
