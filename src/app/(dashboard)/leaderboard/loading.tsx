import { Skeleton } from '@/components/ui/skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      {/* Period tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-lg" />
        ))}
      </div>
      {/* Rank card */}
      <Skeleton className="h-20 rounded-xl" />
      {/* Leaderboard rows */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
