'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { TrendingUp, Brain, Trophy } from 'lucide-react'

const STEPS = ['welcome', 'how-it-works', 'all-set'] as const
type Step = (typeof STEPS)[number]

const HOW_IT_WORKS_CARDS = [
  {
    icon: TrendingUp,
    title: 'Trade with $10,000',
    description: 'Practice with virtual money using real market data',
  },
  {
    icon: Brain,
    title: 'Get AI Coaching',
    description: 'Our AI coach analyzes every trade and helps you learn',
  },
  {
    icon: Trophy,
    title: 'Compete & Earn',
    description: 'Climb the leaderboard and earn daily rewards',
  },
]

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [displayName, setDisplayName] = useState('')
  const [nameError, setNameError] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [cardIndex, setCardIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function checkDisplayName() {
    if (!displayName.trim()) {
      setNameError('Display name is required')
      return false
    }
    if (displayName.trim().length < 3) {
      setNameError('Must be at least 3 characters')
      return false
    }

    setIsChecking(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('display_name', displayName.trim())
      .single()

    setIsChecking(false)

    if (data) {
      setNameError('This name is already taken')
      return false
    }

    setNameError('')
    return true
  }

  async function handleWelcomeNext() {
    const isValid = await checkDisplayName()
    if (isValid) setStep('how-it-works')
  }

  async function handleFinish() {
    setIsSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Session expired. Please log in again.')
      router.push('/login')
      return
    }

    const { error } = await supabase.from('users').insert({
      id: user.id,
      display_name: displayName.trim(),
      cash_balance: 1000000,
      token_balance: 50,
    })

    if (error) {
      toast.error('Something went wrong. Please try again.')
      setIsSubmitting(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Welcome!</h1>
              <p className="text-muted-foreground">Choose a display name to get started</p>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Display name"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value)
                  setNameError('')
                }}
                maxLength={20}
              />
              {nameError && (
                <p className="text-sm text-destructive">{nameError}</p>
              )}
            </div>
            <Button
              className="w-full"
              onClick={handleWelcomeNext}
              disabled={isChecking || !displayName.trim()}
            >
              {isChecking ? 'Checking...' : 'Continue'}
            </Button>
          </motion.div>
        )}

        {step === 'how-it-works' && (
          <motion.div
            key="how-it-works"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">How It Works</h1>
              <p className="text-muted-foreground">
                {cardIndex + 1} of {HOW_IT_WORKS_CARDS.length}
              </p>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={cardIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardContent className="pt-6 text-center space-y-4">
                    {(() => {
                      const Icon = HOW_IT_WORKS_CARDS[cardIndex].icon
                      return <Icon className="mx-auto h-12 w-12 text-primary" />
                    })()}
                    <h2 className="text-xl font-semibold">
                      {HOW_IT_WORKS_CARDS[cardIndex].title}
                    </h2>
                    <p className="text-muted-foreground">
                      {HOW_IT_WORKS_CARDS[cardIndex].description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-2">
              {cardIndex > 0 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCardIndex(cardIndex - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={() => {
                  if (cardIndex < HOW_IT_WORKS_CARDS.length - 1) {
                    setCardIndex(cardIndex + 1)
                  } else {
                    setStep('all-set')
                  }
                }}
              >
                {cardIndex < HOW_IT_WORKS_CARDS.length - 1 ? 'Next' : 'Continue'}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'all-set' && (
          <motion.div
            key="all-set"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-center"
          >
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">You&apos;re All Set! 🎉</h1>
              <p className="text-muted-foreground">
                Welcome, {displayName}! Here&apos;s your starting balance:
              </p>
            </div>
            <div className="py-8">
              <p className="text-5xl font-bold text-gain">$10,000.00</p>
              <p className="text-sm text-muted-foreground mt-2">
                + 50 bonus tokens to get you started
              </p>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Setting up...' : 'Start Trading'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
