'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CtaSection() {
  return (
    <section className="px-4 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-8 text-center sm:p-12"
      >
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to start trading?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Join hundreds of traders practicing risk-free. No credit card required.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/signup">
            Get Started <ArrowRight className="size-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  )
}
