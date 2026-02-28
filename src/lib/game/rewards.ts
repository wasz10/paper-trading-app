const REWARD_TIERS: Record<number, number> = {
  1: 10,
  2: 15,
  3: 20,
  4: 20,
  5: 20,
  6: 20,
  7: 50,
}

export function getRewardForDay(streakDay: number): number {
  const cycleDay = ((streakDay - 1) % 7) + 1
  return REWARD_TIERS[cycleDay] ?? 20
}

export function getNextRewardPreview(currentStreak: number): { day: number; tokens: number }[] {
  const preview: { day: number; tokens: number }[] = []
  for (let i = 1; i <= 7; i++) {
    const day = currentStreak + i
    preview.push({ day, tokens: getRewardForDay(day) })
  }
  return preview
}
