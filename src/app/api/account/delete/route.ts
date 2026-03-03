import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { confirmName } = body

    if (!confirmName) {
      return NextResponse.json({ error: 'Confirmation name required' }, { status: 400 })
    }

    // Fetch profile to validate the confirmation name
    const { data: profile } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (confirmName !== profile.display_name) {
      return NextResponse.json({ error: 'Name does not match' }, { status: 400 })
    }

    // Use admin client for cascade delete (bypasses RLS)
    const admin = createAdminClient()

    // Delete from all tables in dependency order — abort if any fail
    // Tables with user_id foreign key
    const userIdTables = [
      'tutorial_progress',
      'token_transactions',
      'daily_rewards',
      'portfolio_snapshots',
      'leaderboard_cache',
      'trades',
      'holdings',
    ]

    const failedTables: string[] = []
    for (const table of userIdTables) {
      const { error } = await admin.from(table).delete().eq('user_id', user.id)
      if (error) {
        console.error(`Failed to delete from ${table}:`, error)
        failedTables.push(table)
      }
    }

    // Delete from users table — PK column is 'id', not 'user_id'
    const { error: usersError } = await admin.from('users').delete().eq('id', user.id)
    if (usersError) {
      console.error('Failed to delete from users:', usersError)
      failedTables.push('users')
    }

    if (failedTables.length > 0) {
      return NextResponse.json(
        { error: `Failed to delete from: ${failedTables.join(', ')}` },
        { status: 500 }
      )
    }

    // Only delete auth user after all data is confirmed deleted
    const { error: authError } = await admin.auth.admin.deleteUser(user.id)
    if (authError) {
      console.error('Failed to delete auth user:', authError)
      return NextResponse.json({ error: 'Failed to delete auth account' }, { status: 500 })
    }

    return NextResponse.json({ data: { deleted: true } })
  } catch {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
