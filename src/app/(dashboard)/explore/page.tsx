'use client'

import { useState, useMemo } from 'react'
import { StockSearch } from '@/components/market/stock-search'
import { CategoryChips } from '@/components/market/category-chips'
import { WatchlistSection } from '@/components/market/watchlist-section'
import { MarketHoursBanner } from '@/components/market/market-hours-banner'
import { STOCK_CATEGORIES, POPULAR_TICKERS } from '@/lib/market/watchlists'
import { useTutorialStep } from '@/hooks/useTutorialStep'

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Auto-complete "find_stock" tutorial step when page is visited
  useTutorialStep('find_stock')

  const tickers = useMemo(() => {
    if (selectedCategory === 'all') return POPULAR_TICKERS
    const cat = STOCK_CATEGORIES.find((c) => c.id === selectedCategory)
    return cat?.tickers ?? POPULAR_TICKERS
  }, [selectedCategory])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Explore</h1>
      <StockSearch />
      <CategoryChips selected={selectedCategory} onSelect={setSelectedCategory} />
      <WatchlistSection tickers={tickers} />
      <MarketHoursBanner />
    </div>
  )
}
