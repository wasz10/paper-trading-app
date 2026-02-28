export interface StockCategory {
  id: string
  label: string
  tickers: string[]
}

export const STOCK_CATEGORIES: StockCategory[] = [
  { id: 'all', label: 'All', tickers: [] },
  { id: 'tech', label: 'Tech', tickers: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'NVDA', 'TSLA', 'CRM', 'ADBE', 'INTC'] },
  { id: 'healthcare', label: 'Healthcare', tickers: ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'LLY'] },
  { id: 'finance', label: 'Finance', tickers: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'V', 'MA'] },
  { id: 'consumer', label: 'Consumer', tickers: ['DIS', 'NKE', 'SBUX', 'MCD', 'KO', 'PEP', 'WMT', 'COST'] },
  { id: 'energy', label: 'Energy', tickers: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY'] },
  { id: 'meme', label: 'Meme Stocks', tickers: ['GME', 'AMC', 'BB', 'PLTR', 'SOFI', 'RIVN'] },
]

export const POPULAR_TICKERS = [
  'AAPL', 'TSLA', 'AMZN', 'GOOGL', 'MSFT', 'META',
  'NVDA', 'DIS', 'NKE', 'NFLX', 'SBUX', 'JPM',
]
