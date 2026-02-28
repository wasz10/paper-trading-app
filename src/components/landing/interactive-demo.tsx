'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn, formatDollars } from '@/lib/utils'

// Mock stock data with realistic prices
const MOCK_STOCKS = [
  { ticker: 'AAPL', name: 'Apple Inc.', price: 189.84, change: +1.23 },
  { ticker: 'TSLA', name: 'Tesla, Inc.', price: 248.42, change: -3.17 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', price: 174.13, change: +2.05 },
  { ticker: 'AMZN', name: 'Amazon.com', price: 197.56, change: +0.87 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', price: 430.16, change: -1.44 },
]

type DemoStep = 'list' | 'buy' | 'confirm' | 'result'

interface TradeResult {
  ticker: string
  shares: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
}

export function InteractiveDemo() {
  const [step, setStep] = useState<DemoStep>('list')
  const [selectedStock, setSelectedStock] = useState<typeof MOCK_STOCKS[0] | null>(null)
  const [amount, setAmount] = useState('')
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null)
  const [isAnimatingPrice, setIsAnimatingPrice] = useState(false)
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSelectStock = (stock: typeof MOCK_STOCKS[0]) => {
    setSelectedStock(stock)
    setAmount('100')
    setStep('buy')
  }

  const handleBuy = () => {
    if (!selectedStock || !amount) return
    const dollars = parseFloat(amount)
    if (isNaN(dollars) || dollars <= 0) return

    const shares = dollars / selectedStock.price
    setTradeResult({
      ticker: selectedStock.ticker,
      shares,
      entryPrice: selectedStock.price,
      currentPrice: selectedStock.price,
      pnl: 0,
      pnlPercent: 0,
    })
    setStep('confirm')

    // After brief confirmation, start P&L animation
    animationRef.current = setTimeout(() => {
      setStep('result')
      setIsAnimatingPrice(true)
    }, 1200)
  }

  // Animate random P&L changes
  const entryPrice = tradeResult?.entryPrice
  const tradeShares = tradeResult?.shares
  useEffect(() => {
    if (!isAnimatingPrice || entryPrice == null || tradeShares == null) return

    let ticks = 0
    const maxTicks = 8

    const tick = () => {
      ticks++
      // Random walk with slight upward bias
      const changePercent = (Math.random() - 0.45) * 3
      const newPrice = entryPrice * (1 + changePercent / 100)
      const pnl = (newPrice - entryPrice) * tradeShares
      const pnlPercent = ((newPrice - entryPrice) / entryPrice) * 100

      setTradeResult(prev => prev ? {
        ...prev,
        currentPrice: newPrice,
        pnl,
        pnlPercent,
      } : null)

      if (ticks < maxTicks) {
        animationRef.current = setTimeout(tick, 500)
      } else {
        setIsAnimatingPrice(false)
      }
    }

    animationRef.current = setTimeout(tick, 400)

    return () => {
      if (animationRef.current) clearTimeout(animationRef.current)
    }
  }, [isAnimatingPrice, entryPrice, tradeShares])

  const handleReset = useCallback(() => {
    setStep('list')
    setSelectedStock(null)
    setAmount('')
    setTradeResult(null)
    setIsAnimatingPrice(false)
    if (animationRef.current) clearTimeout(animationRef.current)
  }, [])

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
            Experience paper trading in seconds
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm p-0">
            {/* Glass header */}
            <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2 text-sm font-medium">
                <DollarSign className="size-4 text-primary" />
                <span>Paper Trading Demo</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Balance: {formatDollars(10000)}
              </span>
            </div>

            <div className="min-h-[320px] p-4 sm:p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Stock List */}
                {step === 'list' && (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2"
                  >
                    <p className="mb-4 text-sm text-muted-foreground">
                      Pick a stock to trade:
                    </p>
                    {MOCK_STOCKS.map((stock) => (
                      <button
                        key={stock.ticker}
                        onClick={() => handleSelectStock(stock)}
                        className="flex w-full items-center justify-between rounded-lg border bg-background/50 p-3 transition-colors hover:border-primary/50 hover:bg-primary/5 sm:p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary sm:size-10 sm:text-sm">
                            {stock.ticker.slice(0, 2)}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-semibold sm:text-base">{stock.ticker}</div>
                            <div className="text-xs text-muted-foreground">{stock.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold sm:text-base">{formatDollars(stock.price)}</div>
                          <div className={cn(
                            'flex items-center justify-end gap-0.5 text-xs font-medium',
                            stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                          )}>
                            {stock.change >= 0 ? (
                              <TrendingUp className="size-3" />
                            ) : (
                              <TrendingDown className="size-3" />
                            )}
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}

                {/* Step 2: Buy Interface */}
                {step === 'buy' && selectedStock && (
                  <motion.div
                    key="buy"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <button
                      onClick={handleReset}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      &larr; Back to stocks
                    </button>

                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {selectedStock.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-lg font-bold">{selectedStock.ticker}</div>
                        <div className="text-sm text-muted-foreground">{selectedStock.name}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-lg font-bold">{formatDollars(selectedStock.price)}</div>
                        <div className={cn(
                          'text-xs font-medium',
                          selectedStock.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                        )}>
                          {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium">Amount (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="1"
                          max="10000"
                          step="1"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-7 text-lg"
                          placeholder="100"
                        />
                      </div>
                      {amount && parseFloat(amount) > 0 && (
                        <p className="text-xs text-muted-foreground">
                          ~{(parseFloat(amount) / selectedStock.price).toFixed(4)} shares
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {['50', '100', '500', '1000'].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAmount(preset)}
                          className={cn(
                            'flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors',
                            amount === preset
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'hover:border-primary/50'
                          )}
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>

                    <Button
                      onClick={handleBuy}
                      className="w-full"
                      size="lg"
                      disabled={!amount || parseFloat(amount) <= 0}
                    >
                      Buy {selectedStock.ticker}
                    </Button>
                  </motion.div>
                )}

                {/* Step 3: Confirmation Animation */}
                {step === 'confirm' && tradeResult && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="flex min-h-[280px] flex-col items-center justify-center text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                      className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-500/10"
                    >
                      <Check className="size-8 text-emerald-500" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <p className="text-lg font-semibold">Order Filled!</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Bought {tradeResult.shares.toFixed(4)} shares of {tradeResult.ticker}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        at {formatDollars(tradeResult.entryPrice)} per share
                      </p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="mt-4 text-xs text-muted-foreground"
                    >
                      Watching price movement...
                    </motion.div>
                  </motion.div>
                )}

                {/* Step 4: P&L Result */}
                {step === 'result' && tradeResult && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-6"
                  >
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Your {tradeResult.ticker} Position
                      </p>
                    </div>

                    <div className="rounded-xl border bg-background/50 p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Current Price</div>
                          <motion.div
                            key={tradeResult.currentPrice}
                            initial={{ opacity: 0.5 }}
                            animate={{ opacity: 1 }}
                            className="text-xl font-bold"
                          >
                            {formatDollars(tradeResult.currentPrice)}
                          </motion.div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Entry Price</div>
                          <div className="text-xl font-bold">{formatDollars(tradeResult.entryPrice)}</div>
                        </div>
                      </div>

                      <div className="mt-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {tradeResult.shares.toFixed(4)} shares
                          </span>
                          <motion.div
                            key={tradeResult.pnl}
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            className={cn(
                              'flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold',
                              tradeResult.pnl >= 0
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-red-500/10 text-red-500'
                            )}
                          >
                            {tradeResult.pnl >= 0 ? (
                              <TrendingUp className="size-3.5" />
                            ) : (
                              <TrendingDown className="size-3.5" />
                            )}
                            {tradeResult.pnl >= 0 ? '+' : ''}{formatDollars(tradeResult.pnl)}
                            {' '}({tradeResult.pnlPercent >= 0 ? '+' : ''}{tradeResult.pnlPercent.toFixed(2)}%)
                          </motion.div>
                        </div>
                      </div>

                      {isAnimatingPrice && (
                        <div className="mt-3 flex items-center justify-center gap-1.5">
                          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                          <span className="text-xs text-muted-foreground">Price updating live...</span>
                        </div>
                      )}
                    </div>

                    {!isAnimatingPrice && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3"
                      >
                        <Button asChild size="lg" className="w-full">
                          <Link href="/signup">
                            Ready to trade for real? Sign up free <ArrowRight className="size-4" />
                          </Link>
                        </Button>
                        <button
                          onClick={handleReset}
                          className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Try another stock
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
