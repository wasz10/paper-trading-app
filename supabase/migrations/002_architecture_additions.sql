-- ============================================================
-- Paper Trading App — Architecture Additions (MVP Enhancements)
-- ============================================================

-- ── Portfolio Snapshots (for historical charts) ────────────
CREATE TABLE public.portfolio_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_value_cents   INTEGER NOT NULL,
  cash_cents          INTEGER NOT NULL,
  holdings_value_cents INTEGER NOT NULL,
  snapshot_date       DATE NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX idx_snapshots_user_date ON public.portfolio_snapshots(user_id, snapshot_date DESC);

ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snapshots"
  ON public.portfolio_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snapshots"
  ON public.portfolio_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── Order Type on Trades (future-proof) ────────────────────
ALTER TABLE public.trades ADD COLUMN order_type TEXT NOT NULL DEFAULT 'market';
