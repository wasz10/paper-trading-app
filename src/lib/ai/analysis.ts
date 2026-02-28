import { getAnthropicClient } from './client'
import { buildSystemPrompt, buildUserPrompt } from './prompts'

interface AnalysisContext {
  ticker: string
  companyName: string
  tradeType: 'buy' | 'sell'
  shares: number
  price: number
  weekPerformance?: number
  userPL?: number
  isFirstTrade?: boolean
  streakDays?: number
}

export async function generateTradeAnalysis(context: AnalysisContext): Promise<string> {
  const client = getAnthropicClient()

  const systemPrompt = buildSystemPrompt({
    tradeType: context.tradeType,
    profitLoss: context.userPL,
    isFirstTrade: context.isFirstTrade,
    streakDays: context.streakDays,
  })

  const userPrompt = buildUserPrompt({
    ticker: context.ticker,
    companyName: context.companyName,
    tradeType: context.tradeType,
    shares: context.shares,
    price: context.price,
    weekPerformance: context.weekPerformance,
    userPL: context.userPL,
  })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 200,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = message.content.find((b) => b.type === 'text')
  return textBlock?.text ?? 'Great trade! Keep learning and growing your portfolio.'
}
