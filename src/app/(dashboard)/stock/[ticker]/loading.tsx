import { Skeleton } from '@/components/ui/skeleton'

export default function StockDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-20" />
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-48 mt-2" />
      </div>
      <Skeleton className="h-[300px] rounded-xl" />
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
      {/* Buttons */}
      <div className="flex gap-3">
        <Skeleton className="h-11 w-32 rounded-lg" />
        <Skeleton className="h-11 w-32 rounded-lg" />
      </div>
    </div>
  )
}
