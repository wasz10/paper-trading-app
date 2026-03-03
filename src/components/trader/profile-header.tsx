'use client'

import { Badge } from '@/components/ui/badge'
import { FramedAvatar } from '@/components/ui/framed-avatar'
import type { PublicProfile } from '@/types/trader'

interface ProfileHeaderProps {
  profile: PublicProfile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <FramedAvatar
          initials={profile.display_name.slice(0, 2).toUpperCase()}
          badgeFrame={profile.active_badge_frame}
          size="lg"
        />
        <h1 className="text-2xl font-bold tracking-tight">{profile.display_name}</h1>
        {profile.is_subscriber && (
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            PRO
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>Member since {memberSince}</span>
        {profile.current_streak > 0 && (
          <span className="flex items-center gap-1">
            <span>🔥</span>
            <span>{profile.current_streak} day streak</span>
          </span>
        )}
      </div>
    </div>
  )
}
