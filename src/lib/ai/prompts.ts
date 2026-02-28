export function buildSystemPrompt(context: {
  tradeType: 'buy' | 'sell'
  profitLoss?: number
  isFirstTrade?: boolean
  streakDays?: number
}): string {
  let tone = ''

  if (context.isFirstTrade) {
    tone = 'This is the user\'s first trade ever — be extra encouraging and educational.'
  } else if (context.profitLoss !== undefined) {
    if (context.profitLoss > 0) {
      tone = 'The user made a profit — be celebratory and highlight what went right.'
    } else if (context.profitLoss < 0) {
      tone = 'The user took a loss — be encouraging, frame it as a learning experience.'
    }
  }

  if (context.streakDays && context.streakDays >= 7) {
    tone += ' The user has been actively trading for over a week — acknowledge their dedication.'
  }

  return `You are a friendly AI trading coach in a paper trading simulator for teens and young adults.
Keep responses under 100 words. Be conversational, fun, and educational.
Never include financial disclaimers — this is a game with fake money.
${tone}
Analyze the trade and give one specific insight or tip.`
}

export function buildUserPrompt(context: {
  ticker: string
  companyName: string
  tradeType: 'buy' | 'sell'
  shares: number
  price: number
  weekPerformance?: number
  userPL?: number
}): string {
  let prompt = `I just ${context.tradeType === 'buy' ? 'bought' : 'sold'} ${context.shares.toFixed(4)} shares of ${context.ticker} (${context.companyName}) at $${context.price.toFixed(2)}.`

  if (context.weekPerformance !== undefined) {
    prompt += ` The stock is ${context.weekPerformance >= 0 ? 'up' : 'down'} ${Math.abs(context.weekPerformance).toFixed(1)}% this week.`
  }

  if (context.userPL !== undefined) {
    prompt += ` My overall P&L on this stock is ${context.userPL >= 0 ? '+' : ''}$${(context.userPL / 100).toFixed(2)}.`
  }

  return prompt
}
