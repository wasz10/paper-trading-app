import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { executeSell } from '@/lib/trading/engine'
import { getQuote } from '@/lib/market/yahoo'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ticker, shares } = body as { ticker: string; shares: number }

    if (!ticker || !shares || shares <= 0) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const quote = await getQuote(ticker.toUpperCase())
    const result = await executeSell(user.id, ticker.toUpperCase(), shares, quote.priceCents)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.trade })
  } catch {
    return NextResponse.json({ error: 'Trade failed' }, { status: 500 })
  }
}
