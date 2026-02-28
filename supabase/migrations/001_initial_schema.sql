-- ============================================================
-- Paper Trading App — Initial Schema
-- ============================================================

-- ── Custom enum types ────────────────────────────────────────
CREATE TYPE public.trade_type AS ENUM ('buy', 'sell');
CREATE TYPE public.token_reason AS ENUM (
  'daily_reward',
  'weekly_challenge',
  'ai_analysis',
  'extra_trade',
  'cosmetic'
);

-- ── Users table (extends auth.users) ─────────────────────────
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT UNIQUE,
  cash_balance  INTEGER NOT NULL DEFAULT 1000000,      -- cents ($10,000.00)
  token_balance INTEGER NOT NULL DEFAULT 0,
  is_subscriber BOOLEAN NOT NULL DEFAULT FALSE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  trades_today  INTEGER NOT NULL DEFAULT 0,
  trades_today_date DATE,
  timezone      TEXT NOT NULL DEFAULT 'America/New_York',
  show_display_name BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Holdings ─────────────────────────────────────────────────
CREATE TABLE public.holdings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticker          TEXT NOT NULL,
  shares          DECIMAL(10,6) NOT NULL DEFAULT 0,
  avg_cost_cents  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- ── Trades ───────────────────────────────────────────────────
CREATE TABLE public.trades (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticker       TEXT NOT NULL,
  type         public.trade_type NOT NULL,
  shares       DECIMAL(10,6) NOT NULL,
  price_cents  INTEGER NOT NULL,
  total_cents  INTEGER NOT NULL,
  ai_analysis  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Daily Rewards ────────────────────────────────────────────
CREATE TABLE public.daily_rewards (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reward_date   DATE NOT NULL,
  tokens_earned INTEGER NOT NULL,
  streak_day    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, reward_date)
);

-- ── Leaderboard Cache ────────────────────────────────────────
CREATE TABLE public.leaderboard_cache (
  user_id           UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name      TEXT,
  total_return_pct  DECIMAL(10,4) NOT NULL DEFAULT 0,
  is_subscriber     BOOLEAN NOT NULL DEFAULT FALSE,
  show_display_name BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Token Transactions ───────────────────────────────────────
CREATE TABLE public.token_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount      INTEGER NOT NULL,               -- positive = earned, negative = spent
  reason      public.token_reason NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_trades_user_created ON public.trades(user_id, created_at DESC);
CREATE INDEX idx_leaderboard_return ON public.leaderboard_cache(total_return_pct DESC);
CREATE INDEX idx_token_tx_user ON public.token_transactions(user_id, created_at DESC);

-- ============================================================
-- Trigger: auto-update holdings.updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER holdings_updated_at
  BEFORE UPDATE ON public.holdings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Holdings
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own holdings"
  ON public.holdings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holdings"
  ON public.holdings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holdings"
  ON public.holdings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own holdings"
  ON public.holdings FOR DELETE
  USING (auth.uid() = user_id);

-- Trades
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON public.trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON public.trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Daily Rewards
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rewards"
  ON public.daily_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rewards"
  ON public.daily_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Leaderboard Cache — everyone can read, only service role can write
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard_cache FOR SELECT
  USING (true);

-- Token Transactions
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token transactions"
  ON public.token_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token transactions"
  ON public.token_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
