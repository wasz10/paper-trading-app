import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  TUTORIAL_STEPS,
  COMPLETION_BONUS,
  completeTutorialStep,
  isTutorialComplete,
  getCompletedCount,
} from '@/lib/game/tutorial'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { step_id } = body

    const step = TUTORIAL_STEPS.find((s) => s.id === step_id)
    if (!step) {
      return NextResponse.json({ error: 'Invalid step_id' }, { status: 400 })
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

    // Check if already completed
    if (stepsCompleted[step_id]) {
      return NextResponse.json({ error: 'Step already completed' }, { status: 400 })
    }

    // Mark step complete
    const updatedSteps = completeTutorialStep(stepsCompleted, step_id)
    const allComplete = isTutorialComplete(updatedSteps)

    // Calculate tokens
    let tokensEarned = step.tokens
    if (allComplete) {
      tokensEarned += COMPLETION_BONUS.tokens
    }

    // Update tutorial progress
    await supabase
      .from('tutorial_progress')
      .update({
        steps_completed: updatedSteps,
        completed_at: allComplete ? new Date().toISOString() : null,
      })
      .eq('user_id', user.id)

    // Award tokens to user balance
    const { data: profile } = await supabase
      .from('users')
      .select('token_balance')
      .eq('id', user.id)
      .single()

    if (profile) {
      await supabase
        .from('users')
        .update({ token_balance: profile.token_balance + tokensEarned })
        .eq('id', user.id)

      // Log token transaction
      await supabase.from('token_transactions').insert({
        user_id: user.id,
        amount: tokensEarned,
        reason: 'weekly_challenge' as const,
        description: allComplete
          ? `Tutorial complete! ${step.title} + bonus`
          : `Tutorial: ${step.title}`,
      })
    }

    return NextResponse.json({
      data: {
        step_id,
        tokensEarned,
        completedCount: getCompletedCount(updatedSteps),
        totalSteps: TUTORIAL_STEPS.length,
        allComplete,
        stepsCompleted: updatedSteps,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to complete tutorial step' }, { status: 500 })
  }
}
