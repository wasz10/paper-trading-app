import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // Fetch order
    const { data: order } = await supabase
      .from('pending_orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found or not cancellable' }, { status: 404 })
    }

    // Release reservations
    if (order.order_type === 'limit_buy' && order.reserved_cash_cents > 0) {
      const { data: profile } = await supabase
        .from('users')
        .select('reserved_cash')
        .eq('id', user.id)
        .single()

      if (profile) {
        await supabase
          .from('users')
          .update({ reserved_cash: Math.max(0, profile.reserved_cash - order.reserved_cash_cents) })
          .eq('id', user.id)
      }
    }

    if (['limit_sell', 'stop_loss', 'trailing_stop'].includes(order.order_type)) {
      const { data: holding } = await supabase
        .from('holdings')
        .select('id, reserved_shares')
        .eq('user_id', user.id)
        .eq('ticker', order.ticker)
        .single()

      if (holding) {
        await supabase
          .from('holdings')
          .update({ reserved_shares: Math.max(0, Number(holding.reserved_shares) - Number(order.shares)) })
          .eq('id', holding.id)
      }
    }

    // Cancel the order
    const { error } = await supabase
      .from('pending_orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (error) {
      return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
    }

    return NextResponse.json({ data: { ok: true } })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
