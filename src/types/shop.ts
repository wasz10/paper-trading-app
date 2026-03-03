export type ShopCategory = 'theme' | 'badge' | 'boost' | 'perk'

export interface ShopItem {
  id: string
  name: string
  description: string
  icon: string
  category: ShopCategory
  price: number  // tokens
  repeatable: boolean
}

export interface ShopItemWithOwnership extends ShopItem {
  owned: boolean
}
