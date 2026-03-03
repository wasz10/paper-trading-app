import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ITEMS } from '@/lib/shop/items'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const badgeFrame: unknown = body?.badgeFrame
    if (badgeFrame !== null && typeof badgeFrame !== 'string') {
      return NextResponse.json({ error: 'Invalid badge frame value' }, { status: 400 })
    }

    // null means remove badge frame
    if (badgeFrame !== null) {
      // Validate the badge frame ID exists in SHOP_ITEMS
      const item = SHOP_ITEMS.find((i) => i.id === badgeFrame && i.category === 'badge')
      if (!item) {
        return NextResponse.json({ error: 'Invalid badge frame' }, { status: 400 })
      }

      // Check user owns the item
      const { data: purchase } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', badgeFrame)
        .single()

      if (!purchase) {
        return NextResponse.json({ error: 'You do not own this badge frame' }, { status: 403 })
      }
    }

    // Update active_badge_frame
    const { error: updateError } = await supabase
      .from('users')
      .update({ active_badge_frame: badgeFrame })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update badge frame' }, { status: 500 })
    }

    return NextResponse.json({ data: { success: true } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
