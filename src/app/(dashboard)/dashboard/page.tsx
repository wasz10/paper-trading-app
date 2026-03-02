'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePortfolioStore } from '@/stores/portfolio-store'
import { PortfolioSummary } from '@/components/portfolio/portfolio-summary'
import { HoldingsList } from '@/components/portfolio/holdings-list'
import { AllocationChart } from '@/components/portfolio/allocation-chart'
import { PerformanceChart } from '@/components/portfolio/performance-chart'
import { TradeHistory } from '@/components/trade/trade-history'
import { TutorialSwitcher, type TutorialStyle } from '@/components/tutorial/tutorial-switcher'
import { TutorialToast } from '@/components/tutorial/tutorial-toast'
import { useTutorialStep } from '@/hooks/useTutorialStep'
import { TUTORIAL_STEPS } from '@/lib/game/tutorial'

export default function DashboardPage() {
  const { portfolio, isLoading, fetchPortfolio } = usePortfolioStore()

  // Tutorial state
  const [tutorialStyle, setTutorialStyle] = useState<TutorialStyle>('off')
  const [tutorialProgress, setTutorialProgress] = useState<Record<string, boolean>>({})
  const [tutorialLoaded, setTutorialLoaded] = useState(false)
  const [showTutorialDismissed, setShowTutorialDismissed] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ tokens: number; completed: number; total: number } | null>(null)

  // Auto-complete "check_portfolio" step
  const { completed: checkPortfolioDone, tokensEarned } = useTutorialStep('check_portfolio')

  // Show toast when check_portfolio step completes
  useEffect(() => {
    if (checkPortfolioDone && tokensEarned > 0) {
      const completedCount = Object.values(tutorialProgress).filter(Boolean).length + 1
      setToast({
        tokens: tokensEarned,
        completed: completedCount,
        total: TUTORIAL_STEPS.length,
      })
      // Update local progress
      setTutorialProgress((prev) => ({ ...prev, check_portfolio: true }))
    }
  }, [checkPortfolioDone, tokensEarned]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load tutorial style from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tutorial_style') as TutorialStyle | null
    if (saved) {
      setTutorialStyle(saved)
    } else {
      setTutorialStyle('banner')
    }
  }, [])

  // Fetch tutorial status from API
  useEffect(() => {
    async function fetchTutorialStatus() {
      try {
        const res = await fetch('/api/tutorial/status')
        if (!res.ok) return
        const json = await res.json()
        if (json.data) {
          const progress: Record<string, boolean> = {}
          for (const step of json.data.steps) {
            progress[step.id] = step.completed
          }
          setTutorialProgress(progress)
          if (json.data.isComplete) {
            setShowTutorialDismissed(true)
          }
        }
      } catch {
        // Tutorial is non-critical
      } finally {
        setTutorialLoaded(true)
      }
    }
    fetchTutorialStatus()
  }, [])

  useEffect(() => {
    fetchPortfolio()
  }, [fetchPortfolio])

  const handleTutorialDismiss = useCallback(() => {
    setShowTutorialDismissed(true)
    setTutorialStyle('off')
    localStorage.setItem('tutorial_style', 'off')
  }, [])

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
      {/* Tutorial (if active and not dismissed) */}
      {tutorialLoaded && !showTutorialDismissed && tutorialStyle !== 'off' && (
        <TutorialSwitcher
          style={tutorialStyle}
          progress={tutorialProgress}
          steps={TUTORIAL_STEPS}
          onDismiss={handleTutorialDismiss}
          currentPage="/dashboard"
        />
      )}

      {/* Portfolio Summary */}
      <PortfolioSummary summary={portfolio} />

      {/* Performance Chart */}
      <PerformanceChart />

      {/* Holdings */}
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

      {/* Recent Trades */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Trades</h3>
        <TradeHistory limit={5} />
      </div>

      {/* Tutorial completion toast */}
      {toast && (
        <TutorialToast
          tokens={toast.tokens}
          completed={toast.completed}
          total={toast.total}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
