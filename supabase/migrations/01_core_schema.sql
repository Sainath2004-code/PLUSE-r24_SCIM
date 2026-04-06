-- ============================================================
-- PULSE-R24 CMS — Core Database Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Layout Templates
CREATE TABLE IF NOT EXISTS news_layout_templates (
  template_id TEXT PRIMARY KEY,
  name TEXT,
  grid_columns INT DEFAULT 12,
  blocks JSONB,
  meta JSONB
);

-- 2. News Items
CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES news_layout_templates(template_id),
  blocks JSONB,
  author TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  status TEXT,
  rejection_reason TEXT,
  approved_by TEXT,
  meta JSONB
);

-- 3. Row Level Security (RLS)
ALTER TABLE news_layout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- Allow public read for demo/public view
DROP POLICY IF EXISTS "Public access" ON news_layout_templates;
CREATE POLICY "Public access" ON news_layout_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public access" ON news_items;
CREATE POLICY "Public access" ON news_items FOR SELECT USING (true);

-- Allow authenticated (admins) full access
DROP POLICY IF EXISTS "Admins full access" ON news_layout_templates;
CREATE POLICY "Admins full access" ON news_layout_templates FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins full access" ON news_items;
CREATE POLICY "Admins full access" ON news_items FOR ALL USING (auth.role() = 'authenticated');

-- 4. Storage Buckets
-- Note: Create these in Supabase Dashboard (Storage) if not exist
-- Names: 'news-images', 'news-pdfs' (Set to PUBLIC)

-- ============================================================
-- FINAL STEPS:
-- 1. Enable 'Email' Provider in Supabase Auth -> Providers.
-- 2. Disable 'Confirm Email' for development convenience.
-- 3. Use the 'Quick Demo Login' button on the Admin Sign-in page.
-- ============================================================
