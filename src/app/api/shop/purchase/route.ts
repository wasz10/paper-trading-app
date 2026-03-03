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

    const { itemId } = await request.json()

    const item = SHOP_ITEMS.find((i) => i.id === itemId)
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('token_balance, cash_balance, trades_today, bonus_trades_today')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already owned (non-repeatable items)
    if (!item.repeatable) {
      const { data: existing } = await supabase
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', itemId)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Item already owned' }, { status: 400 })
      }
    }

    // Check sufficient balance
    if (profile.token_balance < item.price) {
      return NextResponse.json({ error: 'Insufficient token balance' }, { status: 400 })
    }

    // Optimistic lock: update token_balance only if it hasn't changed
    const { data: updated } = await supabase
      .from('users')
      .update({ token_balance: profile.token_balance - item.price })
      .eq('id', user.id)
      .eq('token_balance', profile.token_balance)
      .select('id')

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: 'Balance changed, please refresh and try again' },
        { status: 409 }
      )
    }

    // Insert purchase record for non-repeatable items
    if (!item.repeatable) {
      try {
        await supabase.from('user_purchases').insert({
          user_id: user.id,
          item_id: itemId,
        })
      } catch {
        // Unique constraint violation — already purchased by concurrent request
      }
    }

    // Insert token transaction
    const reason = item.category === 'theme' || item.category === 'badge'
      ? 'cosmetic' as const
      : 'extra_trade' as const

    await supabase.from('token_transactions').insert({
      user_id: user.id,
      amount: -item.price,
      reason,
      description: `Purchased ${item.name}`,
    })

    // Apply item effects
    if (item.category === 'theme') {
      await supabase
        .from('users')
        .update({ active_theme: itemId })
        .eq('id', user.id)
    } else if (item.category === 'badge') {
      await supabase
        .from('users')
        .update({ active_badge_frame: itemId })
        .eq('id', user.id)
    } else if (item.id === 'boost_cash') {
      // Add $500 (50000 cents) to cash balance
      await supabase
        .from('users')
        .update({ cash_balance: profile.cash_balance + 50000 })
        .eq('id', user.id)
    } else if (item.id === 'perk_trades') {
      await supabase
        .from('users')
        .update({ bonus_trades_today: profile.bonus_trades_today + 2 })
        .eq('id', user.id)
    }

    return NextResponse.json({
      data: {
        success: true,
        newBalance: profile.token_balance - item.price,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 })
  }
}
