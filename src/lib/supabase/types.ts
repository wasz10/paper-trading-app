// Placeholder — regenerate with:
// npx supabase gen types typescript --local > src/lib/supabase/types.ts
//
// This file will be replaced once Supabase is connected and migrations are applied.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          display_name: string | null
          cash_balance: number
          token_balance: number
          is_subscriber: boolean
          current_streak: number
          last_login_date: string | null
          trades_today: number
          trades_today_date: string | null
          timezone: string
          show_display_name: boolean
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          cash_balance?: number
          token_balance?: number
          is_subscriber?: boolean
          current_streak?: number
          last_login_date?: string | null
          trades_today?: number
          trades_today_date?: string | null
          timezone?: string
          show_display_name?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          cash_balance?: number
          token_balance?: number
          is_subscriber?: boolean
          current_streak?: number
          last_login_date?: string | null
          trades_today?: number
          trades_today_date?: string | null
          timezone?: string
          show_display_name?: boolean
          created_at?: string
        }
      }
      holdings: {
        Row: {
          id: string
          user_id: string
          ticker: string
          shares: number
          avg_cost_cents: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          shares: number
          avg_cost_cents: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ticker?: string
          shares?: number
          avg_cost_cents?: number
          created_at?: string
          updated_at?: string
        }
      }
      trades: {
        Row: {
          id: string
          user_id: string
          ticker: string
          type: 'buy' | 'sell'
          shares: number
          price_cents: number
          total_cents: number
          order_type: string
          ai_analysis: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticker: string
          type: 'buy' | 'sell'
          shares: number
          price_cents: number
          total_cents: number
          order_type?: string
          ai_analysis?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ticker?: string
          type?: 'buy' | 'sell'
          shares?: number
          price_cents?: number
          total_cents?: number
          order_type?: string
          ai_analysis?: string | null
          created_at?: string
        }
      }
      daily_rewards: {
        Row: {
          id: string
          user_id: string
          reward_date: string
          tokens_earned: number
          streak_day: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          reward_date: string
          tokens_earned: number
          streak_day: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          reward_date?: string
          tokens_earned?: number
          streak_day?: number
          created_at?: string
        }
      }
      leaderboard_cache: {
        Row: {
          user_id: string
          display_name: string | null
          total_return_pct: number
          is_subscriber: boolean
          show_display_name: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          display_name?: string | null
          total_return_pct?: number
          is_subscriber?: boolean
          show_display_name?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          display_name?: string | null
          total_return_pct?: number
          is_subscriber?: boolean
          show_display_name?: boolean
          updated_at?: string
        }
      }
      token_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          reason: 'daily_reward' | 'weekly_challenge' | 'ai_analysis' | 'extra_trade' | 'cosmetic'
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          reason: 'daily_reward' | 'weekly_challenge' | 'ai_analysis' | 'extra_trade' | 'cosmetic'
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          reason?: 'daily_reward' | 'weekly_challenge' | 'ai_analysis' | 'extra_trade' | 'cosmetic'
          description?: string
          created_at?: string
        }
      }
      portfolio_snapshots: {
        Row: {
          id: string
          user_id: string
          total_value_cents: number
          cash_cents: number
          holdings_value_cents: number
          snapshot_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_value_cents: number
          cash_cents: number
          holdings_value_cents: number
          snapshot_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_value_cents?: number
          cash_cents?: number
          holdings_value_cents?: number
          snapshot_date?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      trade_type: 'buy' | 'sell'
      token_reason: 'daily_reward' | 'weekly_challenge' | 'ai_analysis' | 'extra_trade' | 'cosmetic'
    }
  }
}
