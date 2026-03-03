-- Weekly challenge claims: prevents double-claiming within a week
CREATE TABLE weekly_challenge_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  tokens_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id, week_start)
);

CREATE INDEX idx_challenge_claims_user ON weekly_challenge_claims(user_id, week_start);

-- RLS
ALTER TABLE weekly_challenge_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claims"
  ON weekly_challenge_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claims"
  ON weekly_challenge_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);
