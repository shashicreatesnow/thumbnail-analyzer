-- ══════════════════════════════════════════════════════════════
-- THUMBNAIL ANALYZER — Supabase Schema
-- Run this in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ══════════════════════════════════════════════════════════════

-- Analyses table — stores every thumbnail analysis
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Owner (links to Supabase Auth user)
  user_id UUID REFERENCES auth.users(id),

  -- Input data
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  script TEXT,
  image_base64 TEXT,  -- thumbnail preview (first 500 chars for small preview)

  -- Score & verdict
  total_score INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  content_type TEXT NOT NULL,
  design_score INTEGER NOT NULL,
  cat_score INTEGER NOT NULL,

  -- Full Gemini analysis JSON
  analysis JSONB NOT NULL,

  -- Extracted fields for quick display
  text_on_thumbnail TEXT,
  scroll_stop_power TEXT,
  overall_impression TEXT,
  dominant_colors TEXT,
  complete_thumbnail_feedback TEXT,

  -- Warnings & tips (arrays stored as JSONB)
  cat_warnings JSONB DEFAULT '[]',
  cat_tips JSONB DEFAULT '[]',
  design_breakdown JSONB DEFAULT '[]'
);

-- Index for faster sorting by date
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- Index for user-scoped queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);

-- Enable Row Level Security
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════
-- RLS POLICIES — Each user can only access their own analyses
-- ══════════════════════════════════════════════════════════════
-- NOTE: If upgrading from the old "Allow all operations" policy,
-- run this in Supabase SQL Editor first:
--
--   DROP POLICY IF EXISTS "Allow all operations" ON analyses;
--
--   -- Add user_id column if it doesn't exist yet:
--   ALTER TABLE analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
--
-- Then create the new per-user policies:

CREATE POLICY "Users read own analyses"
  ON analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own analyses"
  ON analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own analyses"
  ON analyses FOR DELETE
  USING (auth.uid() = user_id);
