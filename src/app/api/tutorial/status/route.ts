import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TUTORIAL_STEPS, getCompletedCount, isTutorialComplete } from '@/lib/game/tutorial'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create tutorial progress
    let { data: progress } = await supabase
      .from('tutorial_progress')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!progress) {
      const { data: newProgress, error: insertError } = await supabase
        .from('tutorial_progress')
        .insert({ user_id: user.id, steps_completed: {} })
        .select()
        .single()

      if (insertError || !newProgress) {
        return NextResponse.json({ error: 'Failed to create tutorial progress' }, { status: 500 })
      }
      progress = newProgress
    }

    const stepsCompleted = (progress.steps_completed ?? {}) as Record<string, boolean>

    const steps = TUTORIAL_STEPS.map((step) => ({
      ...step,
      completed: !!stepsCompleted[step.id],
    }))

    const completedCount = getCompletedCount(stepsCompleted)
    const totalTokensEarned = steps
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.tokens, 0)
    const totalTokensRemaining = steps
      .filter((s) => !s.completed)
      .reduce((sum, s) => sum + s.tokens, 0)

    return NextResponse.json({
      data: {
        steps,
        completedCount,
        totalSteps: TUTORIAL_STEPS.length,
        isComplete: isTutorialComplete(stepsCompleted),
        completedAt: progress.completed_at,
        totalTokensEarned,
        totalTokensRemaining,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tutorial status' }, { status: 500 })
  }
}
