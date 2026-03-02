'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  ArrowLeftRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Stock {
  ticker: string
  name: string
  price: number
  prevPrice: number
}

interface Holding {
  ticker: string
  shares: number
  avgCost: number
}

type View = 'market' | 'portfolio'

// ── Initial mock data ────────────────────────────────────────────────────────

const INITIAL_STOCKS: Stock[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', price: 189.84, prevPrice: 189.84 },
  { ticker: 'TSLA', name: 'Tesla, Inc.', price: 248.42, prevPrice: 248.42 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 174.13, prevPrice: 174.13 },
  { ticker: 'AMZN', name: 'Amazon.com', price: 197.56, prevPrice: 197.56 },
]

const STARTING_CASH = 10_000

// ── Component ────────────────────────────────────────────────────────────────

export function InteractiveDemo() {
  // State
  const [stocks, setStocks] = useState<Stock[]>(INITIAL_STOCKS)
  const [cash, setCash] = useState(STARTING_CASH)
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [view, setView] = useState<View>('market')
  const [notification, setNotification] = useState<{
    message: string
    type: 'buy' | 'sell'
  } | null>(null)
  const notifTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Price ticker — random walk every 2.5s
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setStocks((prev) =>
        prev.map((s) => {
          // Random walk: -0.8% to +0.8%
          const changePct = (Math.random() - 0.48) * 1.6
          const newPrice = +(s.price * (1 + changePct / 100)).toFixed(2)
          return { ...s, prevPrice: s.price, price: Math.max(0.01, newPrice) }
        })
      )
    }, 2500)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Show notification briefly
  const flash = useCallback(
    (message: string, type: 'buy' | 'sell') => {
      if (notifTimer.current) clearTimeout(notifTimer.current)
      setNotification({ message, type })
      notifTimer.current = setTimeout(() => setNotification(null), 2000)
    },
    []
  )

  // Cleanup notification timer
  useEffect(() => {
    return () => {
      if (notifTimer.current) clearTimeout(notifTimer.current)
    }
  }, [])

  // Buy handler — buys a fixed dollar amount
  const handleBuy = useCallback(
    (ticker: string) => {
      const stock = stocks.find((s) => s.ticker === ticker)
      if (!stock) return

      // Buy $500 worth, or remaining cash if less
      const amount = Math.min(500, cash)
      if (amount < 1) return

      const shares = amount / stock.price
      setCash((c) => +(c - amount).toFixed(2))

      setHoldings((prev) => {
        const existing = prev.find((h) => h.ticker === ticker)
        if (existing) {
          const totalCost =
            existing.avgCost * existing.shares + stock.price * shares
          const totalShares = existing.shares + shares
          return prev.map((h) =>
            h.ticker === ticker
              ? { ...h, shares: totalShares, avgCost: totalCost / totalShares }
              : h
          )
        }
        return [...prev, { ticker, shares, avgCost: stock.price }]
      })

      flash(`Bought ${shares.toFixed(2)} ${ticker} @ ${fmt(stock.price)}`, 'buy')
    },
    [stocks, cash, flash]
  )

  // Sell handler — sells entire position
  const handleSell = useCallback(
    (ticker: string) => {
      const stock = stocks.find((s) => s.ticker === ticker)
      const holding = holdings.find((h) => h.ticker === ticker)
      if (!stock || !holding) return

      const proceeds = holding.shares * stock.price
      setCash((c) => +(c + proceeds).toFixed(2))
      setHoldings((prev) => prev.filter((h) => h.ticker !== ticker))

      flash(
        `Sold ${holding.shares.toFixed(2)} ${ticker} @ ${fmt(stock.price)}`,
        'sell'
      )
    },
    [stocks, holdings, flash]
  )

  // Compute portfolio value
  const portfolioValue = holdings.reduce((sum, h) => {
    const stock = stocks.find((s) => s.ticker === h.ticker)
    return sum + (stock ? stock.price * h.shares : 0)
  }, 0)

  const totalValue = cash + portfolioValue
  const totalPnl = totalValue - STARTING_CASH
  const totalPnlPct =
    STARTING_CASH > 0 ? (totalPnl / STARTING_CASH) * 100 : 0

  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Try It Now
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Buy and sell stocks with fake money — no signup required
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm p-0">
            {/* Header with balance + tabs */}
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
              <div className="flex gap-1">
                <button
                  onClick={() => setView('market')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    view === 'market'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ArrowLeftRight className="size-3.5" />
                  Market
                </button>
                <button
                  onClick={() => setView('portfolio')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    view === 'portfolio'
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Briefcase className="size-3.5" />
                  Portfolio
                  {holdings.length > 0 && (
                    <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {holdings.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total Value</div>
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <DollarSign className="size-3.5 text-primary" />
                  {fmt(totalValue)}
                </div>
              </div>
            </div>

            {/* P&L bar */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2 sm:px-6">
              <span className="text-xs text-muted-foreground">
                Cash: {fmt(cash)}
              </span>
              <span
                className={cn(
                  'text-xs font-semibold',
                  totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                P&L: {totalPnl >= 0 ? '+' : ''}
                {fmt(totalPnl)} ({totalPnlPct >= 0 ? '+' : ''}
                {totalPnlPct.toFixed(2)}%)
              </span>
            </div>

            {/* Notification toast */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'absolute left-0 right-0 top-[89px] z-10 mx-4 rounded-md px-3 py-2 text-center text-xs font-medium sm:mx-6',
                    notification.type === 'buy'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-red-500/15 text-red-500'
                  )}
                >
                  {notification.message}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="min-h-[340px] p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {/* Market View — stock list with buy buttons */}
                {view === 'market' && (
                  <motion.div
                    key="market"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    <p className="mb-3 text-sm text-muted-foreground">
                      Prices update live. Pick a stock to trade:
                    </p>
                    {stocks.map((stock) => {
                      const priceDelta = stock.price - stock.prevPrice
                      const holding = holdings.find(
                        (h) => h.ticker === stock.ticker
                      )
                      return (
                        <div
                          key={stock.ticker}
                          className="flex items-center justify-between rounded-lg border bg-background/50 p-3 sm:p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary sm:size-10 sm:text-sm">
                              {stock.ticker.slice(0, 2)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold sm:text-base">
                                {stock.ticker}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {stock.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Price + delta */}
                            <div className="text-right">
                              <motion.div
                                key={stock.price}
                                initial={{ color: priceDelta >= 0 ? '#10b981' : '#ef4444' }}
                                animate={{ color: 'var(--foreground)' }}
                                transition={{ duration: 1 }}
                                className="text-sm font-semibold sm:text-base"
                              >
                                {fmt(stock.price)}
                              </motion.div>
                              <div
                                className={cn(
                                  'flex items-center justify-end gap-0.5 text-xs font-medium',
                                  priceDelta >= 0
                                    ? 'text-emerald-500'
                                    : 'text-red-500'
                                )}
                              >
                                {priceDelta >= 0 ? (
                                  <TrendingUp className="size-3" />
                                ) : (
                                  <TrendingDown className="size-3" />
                                )}
                                {priceDelta >= 0 ? '+' : ''}
                                {priceDelta.toFixed(2)}
                              </div>
                            </div>

                            {/* Buy / Sell buttons */}
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleBuy(stock.ticker)}
                                disabled={cash < 1}
                                className="rounded-md bg-emerald-500/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-500 transition-colors hover:bg-emerald-500/25 disabled:opacity-40"
                              >
                                Buy
                              </button>
                              <button
                                onClick={() => handleSell(stock.ticker)}
                                disabled={!holding}
                                className="rounded-md bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/25 disabled:opacity-40"
                              >
                                Sell
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </motion.div>
                )}

                {/* Portfolio View — holdings + P&L breakdown */}
                {view === 'portfolio' && (
                  <motion.div
                    key="portfolio"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    {holdings.length === 0 ? (
                      <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                        <Briefcase className="mb-3 size-10 text-muted-foreground/50" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No holdings yet
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/70">
                          Switch to Market and buy some stocks!
                        </p>
                        <button
                          onClick={() => setView('market')}
                          className="mt-4 text-xs font-medium text-primary hover:underline"
                        >
                          Go to Market
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Your positions:
                        </p>
                        {holdings.map((h) => {
                          const stock = stocks.find(
                            (s) => s.ticker === h.ticker
                          )
                          if (!stock) return null
                          const marketVal = stock.price * h.shares
                          const costBasis = h.avgCost * h.shares
                          const pnl = marketVal - costBasis
                          const pnlPct =
                            costBasis > 0 ? (pnl / costBasis) * 100 : 0

                          return (
                            <div
                              key={h.ticker}
                              className="rounded-lg border bg-background/50 p-3 sm:p-4"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                    {h.ticker.slice(0, 2)}
                                  </div>
                                  <div>
                                    <div className="text-sm font-semibold">
                                      {h.ticker}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {h.shares.toFixed(2)} shares @ avg{' '}
                                      {fmt(h.avgCost)}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-sm font-semibold">
                                    {fmt(marketVal)}
                                  </div>
                                  <motion.div
                                    key={pnl}
                                    initial={{ scale: 1.05 }}
                                    animate={{ scale: 1 }}
                                    className={cn(
                                      'text-xs font-medium',
                                      pnl >= 0
                                        ? 'text-emerald-500'
                                        : 'text-red-500'
                                    )}
                                  >
                                    {pnl >= 0 ? '+' : ''}
                                    {fmt(pnl)} ({pnlPct >= 0 ? '+' : ''}
                                    {pnlPct.toFixed(2)}%)
                                  </motion.div>
                                </div>
                              </div>

                              <div className="mt-2 flex justify-end">
                                <button
                                  onClick={() => handleSell(h.ticker)}
                                  className="rounded-md bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/25"
                                >
                                  Sell All
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA Footer */}
            <div className="border-t px-4 py-4 sm:px-6">
              <Button asChild size="lg" className="w-full">
                <Link href="/signup">
                  Ready to trade for real? Sign up free{' '}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
