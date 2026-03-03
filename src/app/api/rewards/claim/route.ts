import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateStreak } from '@/lib/game/streaks'
import { getRewardForDay } from '@/lib/game/rewards'
import { checkAndAwardAchievements } from '@/lib/game/achievements'

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

    // Optimistic lock: only update if last_login_date and token_balance haven't changed
    const updateQuery = supabase
      .from('users')
      .update({
        current_streak: newStreak,
        last_login_date: today,
        token_balance: profile.token_balance + tokensEarned,
      })
      .eq('id', user.id)
      .eq('token_balance', profile.token_balance)

    // Handle null vs non-null last_login_date for the optimistic lock
    const { data: updated } = profile.last_login_date
      ? await updateQuery.eq('last_login_date', profile.last_login_date).select('id')
      : await updateQuery.is('last_login_date', null).select('id')

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'Already claimed or balance changed, please refresh' },
        { status: 409 }
      )
    }

    // Insert daily reward record (unique constraint on user_id, reward_date as safety net)
    try {
      await supabase.from('daily_rewards').insert({
        user_id: user.id,
        reward_date: today,
        tokens_earned: tokensEarned,
        streak_day: newStreak,
      })
    } catch {
      // Unique constraint violation — reward was already recorded by a concurrent request
      // The optimistic lock above should prevent this, but handle gracefully
    }

    // Insert token transaction
    await supabase.from('token_transactions').insert({
      user_id: user.id,
      amount: tokensEarned,
      reason: 'daily_reward' as const,
      description: `Day ${newStreak} reward`,
    })

    // Fire-and-forget achievement check (streak milestones)
    checkAndAwardAchievements(user.id).catch(() => {})

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
