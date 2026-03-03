import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TUTORIAL_STEPS } from '@/lib/game/tutorial'
import { checkDevAccess } from '@/lib/dev-guard'

export async function POST(request: NextRequest) {
  const access = await checkDevAccess()
  if (!access.allowed) return access.response

  try {
    const { action } = await request.json()
    const supabase = await createClient()

    if (action === 'complete') {
      const allSteps: Record<string, boolean> = {}
      for (const step of TUTORIAL_STEPS) {
        allSteps[step.id] = true
      }

      await supabase
        .from('tutorial_progress')
        .upsert(
          {
            user_id: access.userId,
            steps_completed: allSteps,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      return NextResponse.json({ ok: true, action: 'complete' })
    } else if (action === 'reset') {
      await supabase
        .from('tutorial_progress')
        .delete()
        .eq('user_id', access.userId)

      return NextResponse.json({ ok: true, action: 'reset' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
