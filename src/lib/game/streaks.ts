export function calculateStreak(
  lastLoginDate: string | null,
  currentStreak: number,
  today: string
): { newStreak: number; canClaim: boolean } {
  if (!lastLoginDate) {
    return { newStreak: 1, canClaim: true }
  }

  if (lastLoginDate === today) {
    return { newStreak: currentStreak, canClaim: false }
  }

  const last = new Date(lastLoginDate)
  const now = new Date(today)
  const diffMs = now.getTime() - last.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 1) {
    return { newStreak: currentStreak + 1, canClaim: true }
  }

  // Streak broken — reset to 1
  return { newStreak: 1, canClaim: true }
}
