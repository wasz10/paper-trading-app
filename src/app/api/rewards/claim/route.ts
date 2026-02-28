import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak } from '@/lib/game/streaks'
import { getRewardForDay } from '@/lib/game/rewards'

export async function POST() {
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

    if (!canClaim) {
      return NextResponse.json({ error: 'Already claimed today' }, { status: 400 })
    }

    const tokensEarned = getRewardForDay(newStreak)

    // Update user
    await supabase
      .from('users')
      .update({
        current_streak: newStreak,
        last_login_date: today,
        token_balance: profile.token_balance + tokensEarned,
      })
      .eq('id', user.id)

    // Insert daily reward record
    await supabase.from('daily_rewards').insert({
      user_id: user.id,
      reward_date: today,
      tokens_earned: tokensEarned,
      streak_day: newStreak,
    })

    // Insert token transaction
    await supabase.from('token_transactions').insert({
      user_id: user.id,
      amount: tokensEarned,
      reason: 'daily_reward' as const,
      description: `Day ${newStreak} reward`,
    })

    return NextResponse.json({
      data: {
        tokensEarned,
        newStreak,
        newBalance: profile.token_balance + tokensEarned,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 })
  }
}
