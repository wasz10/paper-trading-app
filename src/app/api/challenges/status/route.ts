import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { WEEKLY_CHALLENGES, getWeekStartDate } from '@/lib/game/challenges'
import type { ChallengeStats } from '@/lib/game/challenges'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile for timezone and streak
    const { data: profile } = await supabase
      .from('users')
      .select('timezone, current_streak')
      .eq('id', user.id)
      .single()

    const timezone = profile?.timezone ?? 'America/New_York'
    const weekStart = getWeekStartDate(timezone)

    // Count trades this week
    const { count: tradesThisWeek } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', `${weekStart}T00:00:00Z`)

    // Find new tickers bought this week that weren't bought before this week
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
      consecutiveLoginDays: profile?.current_streak ?? 0,
      newTickersBoughtThisWeek,
    }

    // Check which challenges have been claimed this week
    const { data: claims } = await supabase
      .from('weekly_challenge_claims')
      .select('challenge_id')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)

    const claimedIds = new Set((claims ?? []).map((c) => c.challenge_id))

    const challenges = WEEKLY_CHALLENGES.map((ch) => ({
      id: ch.id,
      title: ch.title,
      description: ch.description,
      reward: ch.reward,
      target: ch.target,
      progress: ch.progress(stats),
      completed: ch.check(stats),
      claimed: claimedIds.has(ch.id),
    }))

    return NextResponse.json({ data: { challenges, weekStart } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
