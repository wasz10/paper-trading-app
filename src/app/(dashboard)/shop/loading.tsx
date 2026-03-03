import { Skeleton } from '@/components/ui/skeleton'

export default function ShopLoading() {
  return (
    <div className="space-y-6">
      {/* Title + balance */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* Category tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-16 rounded-md" />
        ))}
      </div>
      {/* Item grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
