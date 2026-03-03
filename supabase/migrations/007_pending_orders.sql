-- Pending orders for limit/stop/trailing stop
CREATE TABLE pending_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('limit_buy', 'limit_sell', 'stop_loss', 'trailing_stop')),
  time_in_force TEXT NOT NULL DEFAULT 'gtc' CHECK (time_in_force IN ('gtc', 'day')),

  -- Price conditions
  target_price_cents INTEGER,
  trail_amount_cents INTEGER,
  trail_percent DECIMAL(5,2),
  high_water_mark_cents INTEGER,

  -- Quantity
  shares DECIMAL(10,6) NOT NULL,

  -- Reservation
  reserved_cash_cents INTEGER NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'expired')),
  filled_price_cents INTEGER,
  filled_at TIMESTAMPTZ,
  trade_id UUID REFERENCES trades(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_pending_orders_user ON pending_orders(user_id, status);
CREATE INDEX idx_pending_orders_status ON pending_orders(status, ticker);

-- RLS
ALTER TABLE pending_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON pending_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON pending_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON pending_orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Add reserved columns to existing tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS reserved_cash INTEGER NOT NULL DEFAULT 0;
ALTER TABLE holdings ADD COLUMN IF NOT EXISTS reserved_shares DECIMAL(10,6) NOT NULL DEFAULT 0;
