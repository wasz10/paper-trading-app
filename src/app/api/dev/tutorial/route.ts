import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TUTORIAL_STEPS } from '@/lib/game/tutorial'

export async function POST(request: NextRequest) {
  if (process.env.DEV_PANEL_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Dev panel disabled' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    const admin = createAdminClient()

    if (action === 'complete') {
      const allSteps: Record<string, boolean> = {}
      for (const step of TUTORIAL_STEPS) {
        allSteps[step.id] = true
      }

      await admin
        .from('tutorial_progress')
        .upsert(
          {
            user_id: user.id,
            steps_completed: allSteps,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      return NextResponse.json({ ok: true, action: 'complete' })
    } else if (action === 'reset') {
      await admin
        .from('tutorial_progress')
        .delete()
        .eq('user_id', user.id)

      return NextResponse.json({ ok: true, action: 'reset' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
