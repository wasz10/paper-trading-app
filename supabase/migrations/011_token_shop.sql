-- Token shop: user purchases
CREATE TABLE user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id VARCHAR(50) NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE user_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON user_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON user_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_purchases_user ON user_purchases(user_id);

-- Add cosmetic columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_theme VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_badge_frame VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_trades_today INTEGER NOT NULL DEFAULT 0;
