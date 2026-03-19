-- ══════════════════════════════════════════════════════════════
-- THUMBNAIL ANALYZER — Supabase Schema
-- Run this in your Supabase SQL Editor:
--   Dashboard → SQL Editor → New Query → Paste → Run
-- ══════════════════════════════════════════════════════════════

-- Analyses table — stores every thumbnail analysis
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

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

-- Enable Row Level Security (allow all for now — no auth)
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Policy: allow all operations (single-user tool, no auth)
CREATE POLICY "Allow all operations" ON analyses
  FOR ALL
  USING (true)
  WITH CHECK (true);
