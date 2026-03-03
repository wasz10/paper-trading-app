import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkDevAccess } from '@/lib/dev-guard'

const MAX_TOKENS = 100_000

export async function POST(request: NextRequest) {
  const access = await checkDevAccess()
  if (!access.allowed) return access.response

  try {
    const { balance } = await request.json()
    if (typeof balance !== 'number' || !Number.isInteger(balance) || balance < 0 || balance > MAX_TOKENS) {
      return NextResponse.json({ error: `Invalid balance (0-${MAX_TOKENS})` }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('users')
      .update({ token_balance: balance })
      .eq('id', access.userId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, token_balance: balance })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
