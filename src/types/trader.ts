export interface PublicProfile {
  id: string
  display_name: string
  is_subscriber: boolean
  created_at: string  // member since
  current_streak: number
  total_return_pct: number
  trade_count: number
  achievement_ids: string[]  // list of unlocked achievement IDs
}
