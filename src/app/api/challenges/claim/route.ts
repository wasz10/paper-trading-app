import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WEEKLY_CHALLENGES, getWeekStartDate } from '@/lib/game/challenges'
import type { ChallengeStats } from '@/lib/game/challenges'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { challengeId } = await request.json()
    const challenge = WEEKLY_CHALLENGES.find((c) => c.id === challengeId)
    if (!challenge) {
      return NextResponse.json({ error: 'Unknown challenge' }, { status: 400 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('timezone, current_streak, token_balance')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const timezone = profile.timezone ?? 'America/New_York'
    const weekStart = getWeekStartDate(timezone)

    // Check if already claimed this week
    const { data: existingClaim } = await supabase
      .from('weekly_challenge_claims')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .eq('week_start', weekStart)
      .maybeSingle()

    if (existingClaim) {
      return NextResponse.json({ error: 'Already claimed this week' }, { status: 409 })
    }

    // Verify challenge is actually completed
    const { count: tradesThisWeek } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${weekStart}T00:00:00Z`)

    const { data: thisWeekBuys } = await supabase
      .from('trades')
      .select('ticker')
      .eq('user_id', user.id)
      .eq('type', 'buy')
      .gte('created_at', `${weekStart}T00:00:00Z`)

    const { data: allTimeBuys } = await supabase
      .from('trades')
      .select('ticker')
      .eq('user_id', user.id)
      .eq('type', 'buy')
      .lt('created_at', `${weekStart}T00:00:00Z`)

    const allTimeTickerSet = new Set((allTimeBuys ?? []).map((t) => t.ticker))
    const thisWeekTickers = new Set((thisWeekBuys ?? []).map((t) => t.ticker))
    let newTickersBoughtThisWeek = 0
    for (const ticker of thisWeekTickers) {
      if (!allTimeTickerSet.has(ticker)) newTickersBoughtThisWeek++
    }

    const stats: ChallengeStats = {
      tradesThisWeek: tradesThisWeek ?? 0,
      consecutiveLoginDays: profile.current_streak ?? 0,
      newTickersBoughtThisWeek,
    }

    if (!challenge.check(stats)) {
      return NextResponse.json({ error: 'Challenge not completed' }, { status: 400 })
    }

    // Award tokens with optimistic lock
    const { error: updateError } = await supabase
      .from('users')
      .update({ token_balance: profile.token_balance + challenge.reward })
      .eq('id', user.id)
      .eq('token_balance', profile.token_balance)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to award tokens' }, { status: 500 })
    }

    // Record claim
    await supabase.from('weekly_challenge_claims').insert({
      user_id: user.id,
      challenge_id: challengeId,
      week_start: weekStart,
      tokens_earned: challenge.reward,
    })

    // Record token transaction
    await supabase.from('token_transactions').insert({
      user_id: user.id,
      amount: challenge.reward,
      reason: 'weekly_challenge',
      description: `Weekly challenge: ${challenge.title}`,
    })

    return NextResponse.json({
      data: { ok: true, tokensEarned: challenge.reward },
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
