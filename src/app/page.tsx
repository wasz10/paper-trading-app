import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesGrid } from '@/components/landing/features-grid'
import { SocialProof } from '@/components/landing/social-proof'
import { CtaSection } from '@/components/landing/cta-section'

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesGrid />
      <SocialProof />
      <CtaSection />
    </main>
  )
}
