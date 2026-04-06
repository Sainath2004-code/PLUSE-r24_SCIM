-- Supabase Phase 3 Setup Script
-- Run this in your Supabase SQL Editor

-- 1. Setup 'news-images' bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('news-images', 'news-images', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access to news-images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'news-images' );

-- Grant authenticated upload access to news-images
CREATE POLICY "Authenticated Auth Uploads" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'news-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Auth Updates" 
ON storage.objects FOR UPDATE 
WITH CHECK ( bucket_id = 'news-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated Auth Deletes" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'news-images' AND auth.role() = 'authenticated' );

-- 2. Setup view count increment logic
-- Adds viewCount to news_items if it doesn't exist
ALTER TABLE public.news_items ADD COLUMN IF NOT EXISTS "viewCount" INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION increment_view_count(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.news_items
  SET "viewCount" = COALESCE("viewCount", 0) + 1
  WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

-- 3. Setup Text Search RPC
-- Simple search function over title and markdown fields stored in the JSON blocks
CREATE OR REPLACE FUNCTION search_published_news(search_term TEXT)
RETURNS SETOF public.news_items AS $$
BEGIN
  -- If empty query, return all published
  IF search_term IS NULL OR search_term = '' THEN
    RETURN QUERY SELECT * FROM public.news_items WHERE status = 'published';
  ELSE
    -- Basic ILIKE search against the blocks JSONB text representation
    RETURN QUERY 
    SELECT * FROM public.news_items 
    WHERE status = 'published' 
    AND blocks::text ILIKE '%' || search_term || '%';
  END IF;
END;
$$ LANGUAGE plpgsql;
