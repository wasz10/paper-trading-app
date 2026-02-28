export function calculateWeightedAvgCost(
  existingShares: number,
  existingAvgCostCents: number,
  newShares: number,
  newPriceCents: number
): number {
  const totalShares = existingShares + newShares
  if (totalShares === 0) return 0
  return Math.round(
    (existingShares * existingAvgCostCents + newShares * newPriceCents) / totalShares
  )
}

export function calculateProfitLoss(
  shares: number,
  avgCostCents: number,
  currentPriceCents: number
): { plCents: number; plPercent: number } {
  const plCents = Math.round(shares * (currentPriceCents - avgCostCents))
  const plPercent = avgCostCents > 0
    ? ((currentPriceCents - avgCostCents) / avgCostCents) * 100
    : 0

  return { plCents, plPercent }
}

export function calculatePortfolioValue(
  cashCents: number,
  holdings: { shares: number; currentPriceCents: number }[]
): number {
  const holdingsValue = holdings.reduce(
    (sum, h) => sum + Math.round(h.shares * h.currentPriceCents),
    0
  )
  return cashCents + holdingsValue
}
