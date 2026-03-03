import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      {/* Tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-lg" />
        ))}
      </div>
      {/* Order cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
