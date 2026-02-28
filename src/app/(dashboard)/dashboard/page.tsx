'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePortfolioStore } from '@/stores/portfolio-store'
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary'
import { HoldingsList } from '@/components/portfolio/holdings-list'
import { AllocationChart } from '@/components/portfolio/allocation-chart'
import { PerformanceChart } from '@/components/portfolio/performance-chart'
import { TradeHistory } from '@/components/trade/trade-history'

export default function DashboardPage() {
  const { portfolio, isLoading, fetchPortfolio } = usePortfolioStore()

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  if (isLoading || !portfolio) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[180px] w-full" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[150px] w-full" />
      </div>
    )
  }

  const hasHoldings = portfolio.holdings.length > 0

  return (
    <div className="space-y-6">
      <PortfolioSummary summary={portfolio} />
      <PerformanceChart />

      {hasHoldings ? (
        <>
          <AllocationChart
            holdings={portfolio.holdings}
            cashBalance={portfolio.cashBalance}
          />
          <HoldingsList holdings={portfolio.holdings} />
        </>
      ) : (
        <div className="text-center py-12 space-y-4">
          <p className="text-muted-foreground">
            Your portfolio is empty. Start by exploring stocks!
          </p>
          <Button asChild>
            <Link href="/explore">Explore Stocks</Link>
          </Button>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Trades</h3>
        <TradeHistory />
      </div>
    </div>
  )
}
