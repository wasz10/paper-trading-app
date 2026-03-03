import { Skeleton } from '@/components/ui/skeleton'

export default function RewardsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      {/* Streak display */}
      <Skeleton className="h-32 rounded-xl" />
      {/* Claim button */}
      <Skeleton className="h-11 w-full rounded-lg" />
      {/* Challenges */}
      <Skeleton className="h-6 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  )
}
