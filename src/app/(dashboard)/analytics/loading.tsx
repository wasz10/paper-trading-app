import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <Skeleton className="h-8 w-48" />

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Best/worst trade cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>

      {/* P&L by ticker chart */}
      <Skeleton className="h-[250px] rounded-xl" />

      {/* Monthly returns chart */}
      <Skeleton className="h-[250px] rounded-xl" />
    </div>
  )
}
