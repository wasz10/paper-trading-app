export interface TradeHighlight {
  ticker: string
  type: 'buy' | 'sell'
  shares: number
  price_cents: number
  total_cents: number
  pnl_cents: number  // profit/loss on this trade
  pnl_percent: number
  created_at: string
}

export interface TickerPnL {
  ticker: string
  total_buy_cents: number
  total_sell_cents: number
  net_pnl_cents: number
  trade_count: number
}

export interface MonthlyReturn {
  month: string  // YYYY-MM
  return_percent: number
  start_value_cents: number
  end_value_cents: number
}

export interface AnalyticsData {
  total_trades: number
  win_rate: number  // 0-100
  avg_gain_percent: number
  avg_loss_percent: number
  best_trade: TradeHighlight | null
  worst_trade: TradeHighlight | null
  pnl_by_ticker: TickerPnL[]
  monthly_returns: MonthlyReturn[]
}
