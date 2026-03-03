-- User watchlists
CREATE TABLE user_watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker VARCHAR(10) NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, ticker)
);

ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist" ON user_watchlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist" ON user_watchlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlist" ON user_watchlists
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_watchlists_user ON user_watchlists(user_id, added_at DESC);
