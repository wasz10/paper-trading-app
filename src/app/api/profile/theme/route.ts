import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VALID_THEMES = ['midnight', 'sunset', 'forest'] as const

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { theme } = body as { theme: string | null }

    // Null means reset to Classic (no custom theme)
    if (theme === null) {
      const { error } = await supabase
        .from('users')
        .update({ active_theme: null })
        .eq('id', user.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
      }

      return NextResponse.json({ data: { success: true } })
    }

    // Validate theme name
    if (!VALID_THEMES.includes(theme as typeof VALID_THEMES[number])) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
    }

    const itemId = `theme_${theme}`

    // Check user owns the theme
    const { data: purchase } = await supabase
      .from('user_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .single()

    if (!purchase) {
      return NextResponse.json({ error: 'You do not own this theme' }, { status: 403 })
    }

    // Update active_theme in users table (store the full item ID)
    const { error } = await supabase
      .from('users')
      .update({ active_theme: itemId })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
