import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndAwardAchievements } from '@/lib/game/achievements'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const newlyUnlocked = await checkAndAwardAchievements(user.id)

    return NextResponse.json({ data: { unlocked: newlyUnlocked } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
