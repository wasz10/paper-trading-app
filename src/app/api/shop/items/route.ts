import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SHOP_ITEMS } from '@/lib/shop/items'
import type { ShopItemWithOwnership } from '@/types/shop'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [{ data: profile }, { data: purchases }] = await Promise.all([
      supabase
        .from('users')
        .select('token_balance')
        .eq('id', user.id)
        .single(),
      supabase
        .from('user_purchases')
        .select('item_id')
        .eq('user_id', user.id),
    ])

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const ownedItemIds = new Set((purchases ?? []).map((p) => p.item_id))

    const data: ShopItemWithOwnership[] = SHOP_ITEMS.map((item) => ({
      ...item,
      owned: !item.repeatable && ownedItemIds.has(item.id),
    }))

    return NextResponse.json({ data, balance: profile.token_balance })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shop items' }, { status: 500 })
  }
}
