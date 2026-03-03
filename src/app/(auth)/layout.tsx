export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Branding Panel */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center bg-gradient-to-br from-primary/10 via-background to-chart-1/10 px-12">
        <div className="max-w-md space-y-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Paper<span className="text-primary">Trade</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Learn to trade stocks with zero risk. Practice with $10,000 in virtual cash using real market data.
          </p>
          <div className="flex justify-center gap-8 pt-4 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-foreground">$10k</p>
              <p>Starting cash</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-foreground">Real</p>
              <p>Market data</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold text-foreground">AI</p>
              <p>Trade coach</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex flex-1 flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">{children}</div>
      </div>
    </div>
  )
}
