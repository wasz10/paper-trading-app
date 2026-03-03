import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkDevAccess } from '@/lib/dev-guard'

const MAX_CASH_CENTS = 100_000_000 // $1,000,000

export async function POST(request: NextRequest) {
  const access = await checkDevAccess()
  if (!access.allowed) return access.response

  try {
    const { balanceCents } = await request.json()
    if (typeof balanceCents !== 'number' || balanceCents < 0 || balanceCents > MAX_CASH_CENTS) {
      return NextResponse.json({ error: `Invalid balance (0-${MAX_CASH_CENTS})` }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .update({ cash_balance: balanceCents })
      .eq('id', access.userId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, cash_balance: balanceCents })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
