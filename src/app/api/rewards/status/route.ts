import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak } from '@/lib/game/streaks'
import { getRewardForDay } from '@/lib/game/rewards'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('current_streak, last_login_date, token_balance, timezone')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const today = new Date().toLocaleDateString('en-CA', { timeZone: profile.timezone })
    const { newStreak, canClaim } = calculateStreak(
      profile.last_login_date,
      profile.current_streak,
      today
    )

    const nextReward = canClaim ? getRewardForDay(newStreak) : getRewardForDay(newStreak + 1)

    return NextResponse.json({
      data: {
        currentStreak: profile.current_streak,
        canClaim,
        nextReward,
        tokenBalance: profile.token_balance,
        streakDay: canClaim ? newStreak : profile.current_streak,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 })
  }
}
