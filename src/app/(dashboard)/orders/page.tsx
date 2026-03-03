'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { PendingOrder } from '@/types'

const ORDER_TYPE_LABELS: Record<string, string> = {
  limit_buy: 'Limit Buy',
  limit_sell: 'Limit Sell',
  stop_loss: 'Stop Loss',
  trailing_stop: 'Trailing Stop',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  filled: 'bg-green-500/10 text-green-500',
  cancelled: 'bg-muted text-muted-foreground',
  expired: 'bg-muted text-muted-foreground',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<PendingOrder[]>([])
  const [filter, setFilter] = useState('pending')
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    // Check for fills on page visit
    fetch('/api/orders/check').catch(() => {})
    loadOrders()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadOrders()
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadOrders() {
    setIsLoading(true)
    try {
      const param = filter === 'all' ? '' : `?status=${filter}`
      const res = await fetch(`/api/orders${param}`)
      const json = await res.json()
      setOrders(json.data ?? [])
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCancel(orderId: string) {
    setCancellingId(orderId)
    try {
      const res = await fetch('/api/orders/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      if (!res.ok) {
        const json = await res.json()
        toast.error(json.error ?? 'Failed to cancel')
        return
      }
      toast.success('Order cancelled')
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  function formatPrice(cents: number | null) {
    if (!cents) return '—'
    return `$${(cents / 100).toFixed(2)}`
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Orders</h1>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="filled">Filled</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {filter === 'pending'
              ? 'No pending orders. Place a limit order from any stock page!'
              : 'No orders found.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{order.ticker}</span>
                      <Badge variant="outline" className="text-xs">
                        {ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}
                      </Badge>
                      <Badge className={`text-xs ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Number(order.shares).toFixed(2)} shares
                      {order.target_price_cents && ` @ ${formatPrice(order.target_price_cents)}`}
                      {order.trail_amount_cents && ` trail $${(order.trail_amount_cents / 100).toFixed(2)}`}
                      {order.trail_percent && ` trail ${Number(order.trail_percent)}%`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(order.created_at)}
                      {order.time_in_force === 'day' && ' (Day order)'}
                      {order.filled_at && ` — Filled at ${formatPrice(order.filled_price_cents)}`}
                    </div>
                  </div>
                  {order.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                    >
                      {cancellingId === order.id ? '...' : 'Cancel'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
