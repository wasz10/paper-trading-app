import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeBuy } from '@/lib/trading/engine'
import { getQuote } from '@/lib/market/yahoo'
import { checkAndAwardAchievements } from '@/lib/game/achievements'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticker, dollarAmount } = body as { ticker: string; dollarAmount: number }

    const tickerRegex = /^[A-Z0-9.\-]{1,10}$/
    if (!ticker || typeof ticker !== 'string' || !tickerRegex.test(ticker)) {
      return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
    }

    if (!dollarAmount || dollarAmount < 100) {
      return NextResponse.json({ error: 'Invalid request. Minimum $1.00.' }, { status: 400 })
    }

    const quote = await getQuote(ticker.toUpperCase())

    // Check available cash (total minus reserved)
    const supabaseCheck = await createClient()
    const { data: profile } = await supabaseCheck.from('users').select('reserved_cash').eq('id', user.id).single()
    const reservedCash = profile?.reserved_cash ?? 0

    const result = await executeBuy(user.id, ticker.toUpperCase(), dollarAmount, quote.priceCents, reservedCash)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Fire-and-forget achievement check
    checkAndAwardAchievements(user.id).catch(() => {})

    return NextResponse.json({ data: result.trade })
  } catch {
    return NextResponse.json({ error: 'Trade failed' }, { status: 500 })
  }
}
