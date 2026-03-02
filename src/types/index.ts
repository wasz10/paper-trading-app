// ── Trade & Token enums ──────────────────────────────────────────────
export type TradeType = 'buy' | 'sell'
export type OrderType = 'market' | 'limit' | 'stop'
export type TokenReason =
  | 'daily_reward'
  | 'weekly_challenge'
  | 'ai_analysis'
  | 'extra_trade'
  | 'cosmetic'

// ── User ─────────────────────────────────────────────────────────────
export interface User {
  id: string
  display_name: string | null
  cash_balance: number // cents
  token_balance: number
  is_subscriber: boolean
  current_streak: number
  last_login_date: string | null // ISO date string
  trades_today: number
  trades_today_date: string | null // ISO date string
  timezone: string
  show_display_name: boolean
  created_at: string
}

// ── Holding ──────────────────────────────────────────────────────────
export interface Holding {
  id: string
  user_id: string
  ticker: string
  shares: number // decimal, up to 6 places
  avg_cost_cents: number
  created_at: string
  updated_at: string
}

// ── Trade ────────────────────────────────────────────────────────────
export interface Trade {
  id: string
  user_id: string
  ticker: string
  type: TradeType
  shares: number
  price_cents: number
  total_cents: number
  order_type: OrderType
  ai_analysis: string | null
  created_at: string
}

// ── Portfolio Snapshot ──────────────────────────────────────────────
export interface PortfolioSnapshot {
  id: string
  user_id: string
  total_value_cents: number
  cash_cents: number
  holdings_value_cents: number
  snapshot_date: string // YYYY-MM-DD
  created_at: string
}

// ── Daily Reward ─────────────────────────────────────────────────────
export interface DailyReward {
  id: string
  user_id: string
  reward_date: string
  tokens_earned: number
  streak_day: number
  created_at: string
}

// ── Leaderboard Entry ────────────────────────────────────────────────
export interface LeaderboardEntry {
  display_name: string
  total_return_pct: number
  is_subscriber: boolean
  is_current_user: boolean
}

// ── Token Transaction ────────────────────────────────────────────────
export interface TokenTransaction {
  id: string
  user_id: string
  amount: number // positive = earned, negative = spent
  reason: TokenReason
  description: string
  created_at: string
}

// ── Market Data ──────────────────────────────────────────────────────
export interface StockQuote {
  ticker: string
  price: number // dollars (display)
  priceCents: number // cents (storage)
  change: number
  changePercent: number
  name: string
  timestamp: number // unix ms
  // Key stats (optional — not all stocks have all fields)
  marketCap?: number
  peRatio?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  volume?: number
  avgVolume?: number
  dividendYield?: number
  eps?: number
}

export interface ChartDataPoint {
  time: string | number // YYYY-MM-DD string for daily+, unix seconds number for intraday
  open?: number
  high?: number
  low?: number
  close: number
  value?: number // alias for line chart
  volume?: number
}

export interface SearchResult {
  ticker: string
  name: string
  exchange: string
  type: string
}

// ── Portfolio ────────────────────────────────────────────────────────
export interface HoldingWithQuote extends Holding {
  currentPrice: number
  currentValue: number
  profitLoss: number
  profitLossPercent: number
}

export interface PortfolioSummary {
  totalValue: number // cents
  cashBalance: number // cents
  holdingsValue: number // cents
  dailyPL: number // cents
  totalPL: number // cents
  totalPLPercent: number
  holdings: HoldingWithQuote[]
}

// ── API Response ─────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data?: T
  error?: string
}
