import { createAdminClient } from '@/lib/supabase/admin'
import { sendPushNotification } from '@/lib/notifications/push'

export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  tokens: number
  target: number
  category: 'trading' | 'profit' | 'streak' | 'portfolio' | 'misc'
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_trade', name: 'First Steps', description: 'Execute your first trade', icon: '🏁', tokens: 10, target: 1, category: 'trading' },
  { id: 'ten_trades', name: 'Getting Started', description: 'Execute 10 trades', icon: '📈', tokens: 25, target: 10, category: 'trading' },
  { id: 'fifty_trades', name: 'Active Trader', description: 'Execute 50 trades', icon: '🔥', tokens: 50, target: 50, category: 'trading' },
  { id: 'hundred_trades', name: 'Trading Machine', description: 'Execute 100 trades', icon: '⚡', tokens: 100, target: 100, category: 'trading' },
  { id: 'first_profit', name: 'In the Green', description: 'Close a trade with profit', icon: '💚', tokens: 15, target: 1, category: 'profit' },
  { id: 'thousand_profit', name: 'Big Winner', description: 'Earn $1,000 in total profit', icon: '💰', tokens: 50, target: 100_000, category: 'profit' },
  { id: 'five_k_profit', name: 'Wolf of Paper Street', description: 'Earn $5,000 in total profit', icon: '🐺', tokens: 100, target: 500_000, category: 'profit' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Reach a 7-day login streak', icon: '📅', tokens: 25, target: 7, category: 'streak' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Reach a 30-day login streak', icon: '👑', tokens: 75, target: 30, category: 'streak' },
  { id: 'portfolio_15k', name: 'Growing Portfolio', description: 'Portfolio value reaches $15,000', icon: '🌱', tokens: 25, target: 1_500_000, category: 'portfolio' },
  { id: 'portfolio_20k', name: 'Serious Investor', description: 'Portfolio value reaches $20,000', icon: '📊', tokens: 50, target: 2_000_000, category: 'portfolio' },
  { id: 'portfolio_50k', name: 'Paper Millionaire (Almost)', description: 'Portfolio value reaches $50,000', icon: '🏆', tokens: 100, target: 5_000_000, category: 'portfolio' },
  { id: 'diversifier', name: 'Diversified', description: 'Own 5 different stocks simultaneously', icon: '🎯', tokens: 20, target: 5, category: 'portfolio' },
  { id: 'tutorial_complete', name: 'Graduate', description: 'Complete all tutorial steps', icon: '🎓', tokens: 10, target: 1, category: 'misc' },
  { id: 'first_limit', name: 'Patient Trader', description: 'Place your first limit order', icon: '⏳', tokens: 15, target: 1, category: 'misc' },
]

interface UserContext {
  tradeCount: number
  holdingCount: number
  currentStreak: number
  totalProfitCents: number
  hasProfitableSell: boolean
  portfolioValueCents: number
  tutorialCompleted: boolean
  hasPlacedOrder: boolean
}

function checkAchievement(id: string, ctx: UserContext): { unlocked: boolean; progress: number } {
  switch (id) {
    case 'first_trade': return { unlocked: ctx.tradeCount >= 1, progress: Math.min(ctx.tradeCount, 1) }
    case 'ten_trades': return { unlocked: ctx.tradeCount >= 10, progress: Math.min(ctx.tradeCount, 10) }
    case 'fifty_trades': return { unlocked: ctx.tradeCount >= 50, progress: Math.min(ctx.tradeCount, 50) }
    case 'hundred_trades': return { unlocked: ctx.tradeCount >= 100, progress: Math.min(ctx.tradeCount, 100) }
    case 'first_profit': return { unlocked: ctx.hasProfitableSell, progress: ctx.hasProfitableSell ? 1 : 0 }
    case 'thousand_profit': return { unlocked: ctx.totalProfitCents >= 100_000, progress: Math.min(ctx.totalProfitCents, 100_000) }
    case 'five_k_profit': return { unlocked: ctx.totalProfitCents >= 500_000, progress: Math.min(ctx.totalProfitCents, 500_000) }
    case 'streak_7': return { unlocked: ctx.currentStreak >= 7, progress: Math.min(ctx.currentStreak, 7) }
    case 'streak_30': return { unlocked: ctx.currentStreak >= 30, progress: Math.min(ctx.currentStreak, 30) }
    case 'portfolio_15k': return { unlocked: ctx.portfolioValueCents >= 1_500_000, progress: Math.min(ctx.portfolioValueCents, 1_500_000) }
    case 'portfolio_20k': return { unlocked: ctx.portfolioValueCents >= 2_000_000, progress: Math.min(ctx.portfolioValueCents, 2_000_000) }
    case 'portfolio_50k': return { unlocked: ctx.portfolioValueCents >= 5_000_000, progress: Math.min(ctx.portfolioValueCents, 5_000_000) }
    case 'diversifier': return { unlocked: ctx.holdingCount >= 5, progress: Math.min(ctx.holdingCount, 5) }
    case 'tutorial_complete': return { unlocked: ctx.tutorialCompleted, progress: ctx.tutorialCompleted ? 1 : 0 }
    case 'first_limit': return { unlocked: ctx.hasPlacedOrder, progress: ctx.hasPlacedOrder ? 1 : 0 }
    default: return { unlocked: false, progress: 0 }
  }
}

export function getProgress(id: string, ctx: UserContext): number {
  return checkAchievement(id, ctx).progress
}

/**
 * Check all achievements for a user and award any newly unlocked ones.
 * Returns the list of newly unlocked achievement IDs.
 */
export async function checkAndAwardAchievements(userId: string): Promise<string[]> {
  const admin = createAdminClient()

  // Get already-unlocked achievements
  const { data: existing } = await admin
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  const unlockedSet = new Set((existing ?? []).map((a) => a.achievement_id))

  // Only check not-yet-unlocked achievements
  const toCheck = ACHIEVEMENTS.filter((a) => !unlockedSet.has(a.id))
  if (toCheck.length === 0) return []

  // Build user context
  const ctx = await buildUserContext(admin, userId)

  const newlyUnlocked: string[] = []

  for (const ach of toCheck) {
    const { unlocked } = checkAchievement(ach.id, ctx)
    if (!unlocked) continue

    // Award achievement
    const { error } = await admin.from('user_achievements').insert({
      user_id: userId,
      achievement_id: ach.id,
      tokens_earned: ach.tokens,
    })

    // Skip if already exists (race condition)
    if (error) continue

    // Award tokens with optimistic lock to prevent race conditions
    const { data: profile } = await admin.from('users').select('token_balance').eq('id', userId).single()
    if (profile) {
      const { data: updated } = await admin
        .from('users')
        .update({ token_balance: profile.token_balance + ach.tokens })
        .eq('id', userId)
        .eq('token_balance', profile.token_balance)
        .select('id')
      if (!updated || updated.length === 0) continue // balance changed, skip
      await admin.from('token_transactions').insert({
        user_id: userId,
        amount: ach.tokens,
        reason: 'daily_reward' as const,
        description: `Achievement: ${ach.name}`,
      })
    }

    // Create in-app notification
    await admin.from('notifications').insert({
      user_id: userId,
      type: 'achievement',
      title: `Achievement Unlocked: ${ach.name}`,
      body: `${ach.description} — +${ach.tokens} tokens!`,
      url: '/achievements',
    })

    // Send push notification
    await sendPushNotification(userId, {
      title: `Achievement Unlocked: ${ach.name}!`,
      body: `${ach.description} — +${ach.tokens} tokens`,
      url: '/achievements',
    })

    newlyUnlocked.push(ach.id)
  }

  return newlyUnlocked
}

async function buildUserContext(
  admin: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<UserContext> {
  // Parallel fetch all needed data
  const [tradesResult, holdingsResult, profileResult, ordersResult, tutorialResult, profitResult] = await Promise.all([
    admin.from('trades').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('holdings').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('users').select('current_streak, cash_balance').eq('id', userId).single(),
    admin.from('pending_orders').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('tutorial_progress').select('completed_at').eq('user_id', userId).single(),
    // Check for profitable sells: sell trades where the sell price > avg cost of the holding at that time
    admin.from('trades').select('id').eq('user_id', userId).eq('type', 'sell').limit(1),
  ])

  // Calculate total profit from sell trades vs buy avg costs
  // Simplified: check portfolio snapshots or just total P&L from cash + holdings - starting balance
  const cashBalance = profileResult.data?.cash_balance ?? 1_000_000
  // Rough portfolio value = cash + holdings value (we'll approximate with just cash for now since
  // accurate portfolio value requires live quotes — the snapshot cron provides this)
  const { data: latestSnapshot } = await admin
    .from('portfolio_snapshots')
    .select('total_value_cents')
    .eq('user_id', userId)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  const portfolioValueCents = latestSnapshot?.total_value_cents ?? cashBalance
  const totalProfitCents = Math.max(0, portfolioValueCents - 1_000_000) // starting balance is $10k

  // Check if user has any profitable sell (simplified: any sell trade exists and portfolio is above starting)
  const hasProfitableSell = (profitResult.data?.length ?? 0) > 0 && totalProfitCents > 0

  return {
    tradeCount: tradesResult.count ?? 0,
    holdingCount: holdingsResult.count ?? 0,
    currentStreak: profileResult.data?.current_streak ?? 0,
    totalProfitCents,
    hasProfitableSell,
    portfolioValueCents,
    tutorialCompleted: !!tutorialResult.data?.completed_at,
    hasPlacedOrder: (ordersResult.count ?? 0) > 0,
  }
}
