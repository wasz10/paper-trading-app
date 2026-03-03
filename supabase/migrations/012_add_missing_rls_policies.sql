-- Migration 012: Add missing DELETE and UPDATE RLS policies
-- Required after switching dev panel routes from admin client to RLS client.
-- These policies are also good practice for user data self-management.

-- user_purchases: allow users to delete their own purchases (dev reset)
CREATE POLICY "Users can delete own purchases"
  ON user_purchases FOR DELETE
  USING (auth.uid() = user_id);

-- tutorial_progress: allow users to delete their own progress (dev reset, tutorial reset)
CREATE POLICY "Users can delete own tutorial progress"
  ON tutorial_progress FOR DELETE
  USING (auth.uid() = user_id);

-- token_transactions: allow users to delete their own transactions (dev reset)
CREATE POLICY "Users can delete own token transactions"
  ON token_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- daily_rewards: allow users to delete their own reward records (dev reset)
CREATE POLICY "Users can delete own daily rewards"
  ON daily_rewards FOR DELETE
  USING (auth.uid() = user_id);

-- portfolio_snapshots: allow users to delete and update their own snapshots (dev reset, snapshot upsert)
CREATE POLICY "Users can delete own snapshots"
  ON portfolio_snapshots FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own snapshots"
  ON portfolio_snapshots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- leaderboard_cache: allow users to delete their own cache entries (dev reset)
CREATE POLICY "Users can delete own leaderboard cache"
  ON leaderboard_cache FOR DELETE
  USING (auth.uid() = user_id);

-- trades: allow users to delete their own trades (dev reset)
CREATE POLICY "Users can delete own trades"
  ON trades FOR DELETE
  USING (auth.uid() = user_id);
