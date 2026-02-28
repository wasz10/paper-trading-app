'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Brain, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: TrendingUp,
    title: 'Real Market Data',
    description:
      'Trade with live stock prices from major exchanges. Practice buying and selling real tickers without any financial risk.',
  },
  {
    icon: Brain,
    title: 'AI Trade Coach',
    description:
      'Get instant AI-powered analysis on every trade. Learn why a stock moved and how to improve your strategy.',
  },
  {
    icon: Trophy,
    title: 'Compete & Learn',
    description:
      'Climb the leaderboard, earn achievements, and track your progress. See how your portfolio stacks up against others.',
  },
]

export function FeaturesGrid() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to learn trading
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            A complete simulation platform built for beginners and experienced traders alike.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="flex flex-col items-start gap-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
