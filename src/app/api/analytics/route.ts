import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AnalyticsData } from '@/types/analytics'
import {
  computeWinRate,
  computeBestWorstTrades,
  computePnLByTicker,
  computeMonthlyReturns,
  computeAvgGainLoss,
} from '@/lib/analytics/calculations'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [tradesRes, snapshotsRes] = await Promise.all([
      supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(5000),
      supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: true })
        .limit(1000),
    ])

    const trades = tradesRes.data ?? []
    const snapshots = snapshotsRes.data ?? []

    const winRate = computeWinRate(trades)
    const { best, worst } = computeBestWorstTrades(trades)
    const pnlByTicker = computePnLByTicker(trades)
    const monthlyReturns = computeMonthlyReturns(snapshots)
    const { avgGain, avgLoss } = computeAvgGainLoss(trades)

    const data: AnalyticsData = {
      total_trades: trades.length,
      win_rate: winRate,
      avg_gain_percent: avgGain,
      avg_loss_percent: avgLoss,
      best_trade: best,
      worst_trade: worst,
      pnl_by_ticker: pnlByTicker,
      monthly_returns: monthlyReturns,
    }

    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
