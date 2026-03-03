import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkDevAccess } from '@/lib/dev-guard'

const MAX_STREAK = 365

export async function POST(request: NextRequest) {
  const access = await checkDevAccess()
  if (!access.allowed) return access.response

  try {
    const { streak } = await request.json()
    if (typeof streak !== 'number' || !Number.isInteger(streak) || streak < 0 || streak > MAX_STREAK) {
      return NextResponse.json({ error: `Invalid streak (0-${MAX_STREAK})` }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('users')
      .update({ current_streak: streak })
      .eq('id', access.userId)

    if (error) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, current_streak: streak })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
