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
  // Badge upgrades (SVG overlays and animations — require base badge)
  { id: 'badge_gold_svg', name: 'Gold Crown', description: 'Crown overlay for Gold Frame', icon: '👑', category: 'badge', price: 100, repeatable: false, requiresItemId: 'badge_gold' },
  { id: 'badge_gold_animated', name: 'Gold Shimmer', description: 'Animated shimmer for Gold Frame', icon: '✨', category: 'badge', price: 150, repeatable: false, requiresItemId: 'badge_gold_svg' },
  { id: 'badge_diamond_svg', name: 'Diamond Sparkle', description: 'Sparkle overlay for Diamond Frame', icon: '💫', category: 'badge', price: 100, repeatable: false, requiresItemId: 'badge_diamond' },
  { id: 'badge_diamond_animated', name: 'Diamond Shine', description: 'Animated shine for Diamond Frame', icon: '🌟', category: 'badge', price: 150, repeatable: false, requiresItemId: 'badge_diamond_svg' },
  { id: 'badge_fire_svg', name: 'Fire Flames', description: 'Flame overlay for Fire Frame', icon: '🔥', category: 'badge', price: 100, repeatable: false, requiresItemId: 'badge_fire' },
  { id: 'badge_fire_animated', name: 'Fire Blaze', description: 'Animated blaze for Fire Frame', icon: '💥', category: 'badge', price: 150, repeatable: false, requiresItemId: 'badge_fire_svg' },
  // Boosts (200 tokens, repeatable)
  { id: 'boost_cash', name: 'Cash Boost', description: 'Add $500 paper cash to your balance', icon: '💵', category: 'boost', price: 200, repeatable: true },
  // Perks (50 tokens, repeatable)
  { id: 'perk_trades', name: 'Extra Trades', description: '+2 extra trades today', icon: '⚡', category: 'perk', price: 50, repeatable: true },
]
