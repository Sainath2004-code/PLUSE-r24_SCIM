-- ============================================================
-- PULSE-R24 CMS — Database Schema Upgrade
-- Copy & paste this into your Supabase SQL Editor
-- ============================================================

-- 1. Categories table
CREATE TABLE IF NOT EXISTS news_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
INSERT INTO news_categories (name, slug) VALUES
  ('Threat Intel', 'threat-intel'),
  ('Cybersecurity', 'cybersecurity'),
  ('Risk & Resilience', 'risk-resilience'),
  ('Urban Security', 'urban-security')
ON CONFLICT (slug) DO NOTHING;

-- 2. Tags table
CREATE TABLE IF NOT EXISTS news_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL
);

-- 3. News ↔ Tags join table
CREATE TABLE IF NOT EXISTS news_item_tags (
  news_item_id text REFERENCES news_items(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES news_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (news_item_id, tag_id)
);

-- 4. Views tracking (optional — for analytics)
CREATE TABLE IF NOT EXISTS news_item_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  news_item_id text REFERENCES news_items(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  ip_hash text  -- anonymized viewer identifier
);
CREATE INDEX IF NOT EXISTS idx_views_item_id ON news_item_views(news_item_id);
CREATE INDEX IF NOT EXISTS idx_views_date ON news_item_views(viewed_at);

-- 5. Extra columns on news_items
ALTER TABLE news_items
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reading_time integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS slug text;

-- Unique slug index (create after column exists)
CREATE UNIQUE INDEX IF NOT EXISTS idx_news_items_slug
  ON news_items(slug) WHERE slug IS NOT NULL;

-- 6. Full-text search index on title + tags (GIN index)
CREATE INDEX IF NOT EXISTS idx_news_items_fts
  ON news_items USING gin(to_tsvector('english', coalesce(data::text, '')));

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- NOTE: Requires Supabase Auth to be enabled.
-- Enable in: Authentication → Providers → Email
-- ============================================================

-- Enable RLS on news_items (safe to run; if already enabled, no-op)
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;

-- Allow public to read published articles
DROP POLICY IF EXISTS "Public read published" ON news_items;
CREATE POLICY "Public read published"
  ON news_items FOR SELECT
  USING (status = 'published');

-- Allow authenticated users (admins) full access
DROP POLICY IF EXISTS "Admins full access" ON news_items;
CREATE POLICY "Admins full access"
  ON news_items FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE BUCKETS
-- Create these in: Storage → New Bucket
-- ============================================================
-- Bucket name: news-images  (public: true)
-- Bucket name: news-pdfs    (public: true)
-- ============================================================
