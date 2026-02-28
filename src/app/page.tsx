import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Paper<span className="text-primary">Trade</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Learn to invest risk-free. Trade with fake money, get AI coaching,
          and compete on the leaderboard.
        </p>
      </div>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link href="/signup">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    </main>
  )
}
