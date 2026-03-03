import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ACHIEVEMENTS, getProgress } from '@/lib/game/achievements'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Fetch user's unlocked achievements
    const { data: unlocked } = await admin
      .from('user_achievements')
      .select('achievement_id, unlocked_at, tokens_earned')
      .eq('user_id', user.id)

    const unlockedMap = new Map(
      (unlocked ?? []).map((a) => [a.achievement_id, a])
    )

    // Build context for progress
    const [tradesResult, holdingsResult, profileResult, ordersResult, tutorialResult] = await Promise.all([
      admin.from('trades').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      admin.from('holdings').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      admin.from('users').select('current_streak, cash_balance').eq('id', user.id).single(),
      admin.from('pending_orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      admin.from('tutorial_progress').select('completed_at').eq('user_id', user.id).single(),
    ])

    const { data: latestSnapshot } = await admin
      .from('portfolio_snapshots')
      .select('total_value_cents')
      .eq('user_id', user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single()

    const cashBalance = profileResult.data?.cash_balance ?? 1_000_000
    const portfolioValueCents = latestSnapshot?.total_value_cents ?? cashBalance
    const totalProfitCents = Math.max(0, portfolioValueCents - 1_000_000)

    const { data: sellTrades } = await admin
      .from('trades')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'sell')
      .limit(1)

    const ctx = {
      tradeCount: tradesResult.count ?? 0,
      holdingCount: holdingsResult.count ?? 0,
      currentStreak: profileResult.data?.current_streak ?? 0,
      totalProfitCents,
      hasProfitableSell: (sellTrades?.length ?? 0) > 0 && totalProfitCents > 0,
      portfolioValueCents,
      tutorialCompleted: !!tutorialResult.data?.completed_at,
      hasPlacedOrder: (ordersResult.count ?? 0) > 0,
    }

    const achievements = ACHIEVEMENTS.map((ach) => {
      const entry = unlockedMap.get(ach.id)
      return {
        ...ach,
        unlocked: !!entry,
        unlockedAt: entry?.unlocked_at ?? null,
        progress: getProgress(ach.id, ctx),
      }
    })

    return NextResponse.json({ data: achievements })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
