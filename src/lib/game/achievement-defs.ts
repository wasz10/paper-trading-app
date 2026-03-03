export interface AchievementDef {
  id: string
  name: string
  description: string
  icon: string
  tokens: number
  target: number
  category: 'trading' | 'profit' | 'streak' | 'portfolio' | 'misc'
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_trade', name: 'First Steps', description: 'Execute your first trade', icon: '🏁', tokens: 10, target: 1, category: 'trading' },
  { id: 'ten_trades', name: 'Getting Started', description: 'Execute 10 trades', icon: '📈', tokens: 25, target: 10, category: 'trading' },
  { id: 'fifty_trades', name: 'Active Trader', description: 'Execute 50 trades', icon: '🔥', tokens: 50, target: 50, category: 'trading' },
  { id: 'hundred_trades', name: 'Trading Machine', description: 'Execute 100 trades', icon: '⚡', tokens: 100, target: 100, category: 'trading' },
  { id: 'first_profit', name: 'In the Green', description: 'Close a trade with profit', icon: '💚', tokens: 15, target: 1, category: 'profit' },
  { id: 'thousand_profit', name: 'Big Winner', description: 'Earn $1,000 in total profit', icon: '💰', tokens: 50, target: 100_000, category: 'profit' },
  { id: 'five_k_profit', name: 'Wolf of Paper Street', description: 'Earn $5,000 in total profit', icon: '🐺', tokens: 100, target: 500_000, category: 'profit' },
  { id: 'streak_7', name: 'Week Warrior', description: 'Reach a 7-day login streak', icon: '📅', tokens: 25, target: 7, category: 'streak' },
  { id: 'streak_30', name: 'Monthly Master', description: 'Reach a 30-day login streak', icon: '👑', tokens: 75, target: 30, category: 'streak' },
  { id: 'portfolio_15k', name: 'Growing Portfolio', description: 'Portfolio value reaches $15,000', icon: '🌱', tokens: 25, target: 1_500_000, category: 'portfolio' },
  { id: 'portfolio_20k', name: 'Serious Investor', description: 'Portfolio value reaches $20,000', icon: '📊', tokens: 50, target: 2_000_000, category: 'portfolio' },
  { id: 'portfolio_50k', name: 'Paper Millionaire (Almost)', description: 'Portfolio value reaches $50,000', icon: '🏆', tokens: 100, target: 5_000_000, category: 'portfolio' },
  { id: 'diversifier', name: 'Diversified', description: 'Own 5 different stocks simultaneously', icon: '🎯', tokens: 20, target: 5, category: 'portfolio' },
  { id: 'tutorial_complete', name: 'Graduate', description: 'Complete all tutorial steps', icon: '🎓', tokens: 10, target: 1, category: 'misc' },
  { id: 'first_limit', name: 'Patient Trader', description: 'Place your first limit order', icon: '⏳', tokens: 15, target: 1, category: 'misc' },
]
