-- ============================================================
-- Paper Trading App — Portfolio Snapshots: INTEGER → BIGINT
-- ============================================================
-- Upgrade monetary columns to BIGINT for safety at scale.
-- The table already exists from 002_architecture_additions.sql.

ALTER TABLE public.portfolio_snapshots
  ALTER COLUMN total_value_cents    TYPE BIGINT,
  ALTER COLUMN cash_cents           TYPE BIGINT,
  ALTER COLUMN holdings_value_cents TYPE BIGINT;
