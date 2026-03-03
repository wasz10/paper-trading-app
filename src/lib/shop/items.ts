import type { ShopItem } from '@/types/shop'

export const SHOP_ITEMS: ShopItem[] = [
  // Themes (100 tokens each, one-time)
  { id: 'theme_midnight', name: 'Midnight Blue', description: 'A sleek dark blue theme', icon: '🌙', category: 'theme', price: 100, repeatable: false },
  { id: 'theme_sunset', name: 'Sunset Orange', description: 'Warm sunset-inspired colors', icon: '🌅', category: 'theme', price: 100, repeatable: false },
  { id: 'theme_forest', name: 'Forest Green', description: 'Nature-inspired green palette', icon: '🌲', category: 'theme', price: 100, repeatable: false },
  // Badge frames (150-250 tokens, one-time)
  { id: 'badge_gold', name: 'Gold Frame', description: 'A prestigious gold badge frame', icon: '🥇', category: 'badge', price: 150, repeatable: false },
  { id: 'badge_diamond', name: 'Diamond Frame', description: 'The ultimate diamond badge frame', icon: '💎', category: 'badge', price: 250, repeatable: false },
  { id: 'badge_fire', name: 'Fire Frame', description: 'A fiery badge frame', icon: '🔥', category: 'badge', price: 200, repeatable: false },
  // Boosts (200 tokens, repeatable)
  { id: 'boost_cash', name: 'Cash Boost', description: 'Add $500 paper cash to your balance', icon: '💵', category: 'boost', price: 200, repeatable: true },
  // Perks (50 tokens, repeatable)
  { id: 'perk_trades', name: 'Extra Trades', description: '+2 extra trades today', icon: '⚡', category: 'perk', price: 50, repeatable: true },
]
