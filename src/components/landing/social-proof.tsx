'use client'

import { motion } from 'framer-motion'
import { BarChart3, Users, Zap } from 'lucide-react'

const stats = [
  { icon: BarChart3, value: '10K+', label: 'Trades Made' },
  { icon: Users, value: '500+', label: 'Active Traders' },
  { icon: Zap, value: '95%', label: 'Learn Something New' },
]

export function SocialProof() {
  return (
    <section className="border-y bg-muted/30 px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.5 }}
          className="grid gap-8 sm:grid-cols-3"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <stat.icon className="mb-3 size-6 text-primary" />
              <span className="text-3xl font-bold tracking-tight sm:text-4xl">
                {stat.value}
              </span>
              <span className="mt-1 text-sm text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
