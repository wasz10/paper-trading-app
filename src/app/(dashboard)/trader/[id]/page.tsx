'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileHeader } from '@/components/trader/profile-header'
import { ProfileStats } from '@/components/trader/profile-stats'
import { ProfileAchievements } from '@/components/trader/profile-achievements'
import { ShareButton } from '@/components/trader/share-button'
import type { PublicProfile } from '@/types/trader'

export default function TraderProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/trader/${params.id}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) return
        const json = await res.json()
        if (json.data) {
          setProfile(json.data)
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-lg text-muted-foreground">Trader not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <ShareButton traderId={profile.id} />
      </div>

      <ProfileHeader profile={profile} />
      <ProfileStats profile={profile} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Achievements</h2>
        <ProfileAchievements achievementIds={profile.achievement_ids} />
      </div>
    </div>
  )
}
