import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTradeAnalysis } from '@/lib/ai/analysis'
import { getQuote } from '@/lib/market/yahoo'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check token balance
    const { data: profile } = await supabase
      .from('users')
      .select('token_balance, current_streak')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if first daily analysis (free)
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('token_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('reason', 'ai_analysis')
      .gte('created_at', `${today}T00:00:00`)

    const isFirstDaily = (count ?? 0) === 0
    const tokenCost = isFirstDaily ? 0 : 5

    if (!isFirstDaily && profile.token_balance < 5) {
      return NextResponse.json({
        error: 'Not enough tokens. Earn more from daily rewards!',
      }, { status: 400 })
    }

    // Fetch trade
    const { data: trade } = await supabase
      .from('trades')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!trade) {
      return NextResponse.json({ error: 'Trade not found' }, { status: 404 })
    }

    // Already has analysis?
    if (trade.ai_analysis) {
      return NextResponse.json({ data: { analysis: trade.ai_analysis } })
    }

    // Fetch current quote for context
    let companyName = trade.ticker
    let weekPerformance: number | undefined
    try {
      const quote = await getQuote(trade.ticker)
      companyName = quote.name
      weekPerformance = quote.changePercent
    } catch {
      // Continue without extra context
    }

    // Check if first trade ever
    const { count: tradeCount } = await supabase
      .from('trades')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const analysis = await generateTradeAnalysis({
      ticker: trade.ticker,
      companyName,
      tradeType: trade.type as 'buy' | 'sell',
      shares: Number(trade.shares),
      price: trade.price_cents / 100,
      weekPerformance,
      isFirstTrade: (tradeCount ?? 0) <= 1,
      streakDays: profile.current_streak,
    })

    // Save analysis to trade
    await supabase
      .from('trades')
      .update({ ai_analysis: analysis })
      .eq('id', id)

    // Deduct tokens if not free
    if (tokenCost > 0) {
      await supabase
        .from('users')
        .update({ token_balance: profile.token_balance - tokenCost })
        .eq('id', user.id)

      await supabase.from('token_transactions').insert({
        user_id: user.id,
        amount: -tokenCost,
        reason: 'ai_analysis' as const,
        description: `AI analysis for ${trade.ticker} trade`,
      })
    }

    return NextResponse.json({ data: { analysis, tokenCost } })
  } catch {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
