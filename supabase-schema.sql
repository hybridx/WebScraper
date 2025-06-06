-- WebScraper Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  link TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create crawled_urls table
CREATE TABLE IF NOT EXISTS crawled_urls (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  crawled_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create error_urls table
CREATE TABLE IF NOT EXISTS error_urls (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_type ON links(type);
CREATE INDEX IF NOT EXISTS idx_links_name ON links(name);
CREATE INDEX IF NOT EXISTS idx_links_link ON links(link);
CREATE INDEX IF NOT EXISTS idx_crawled_urls_status ON crawled_urls(status);
CREATE INDEX IF NOT EXISTS idx_crawled_urls_url ON crawled_urls(url);

-- Create RPC function for getting file types with counts
CREATE OR REPLACE FUNCTION get_file_types()
RETURNS TABLE(type TEXT, count BIGINT)
LANGUAGE sql
SECURITY definer
AS $$
  SELECT links.type, COUNT(*) as count
  FROM links
  GROUP BY links.type
  ORDER BY count DESC;
$$;

-- Enable Row Level Security (RLS) but allow all operations
-- You can customize these policies as needed
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawled_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_urls ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (customize as needed)
CREATE POLICY "Allow all operations on links" ON links FOR ALL USING (true);
CREATE POLICY "Allow all operations on crawled_urls" ON crawled_urls FOR ALL USING (true);
CREATE POLICY "Allow all operations on error_urls" ON error_urls FOR ALL USING (true);

-- Insert some sample data (optional)
INSERT INTO links (name, link, type) VALUES
  ('Sample Video File', 'https://example.com/video.mp4', 'video'),
  ('Sample Audio File', 'https://example.com/audio.mp3', 'audio'),
  ('Sample Document', 'https://example.com/document.pdf', 'text'),
  ('Sample Image', 'https://example.com/image.jpg', 'image'),
  ('Sample Archive', 'https://example.com/archive.zip', 'compressed')
ON CONFLICT (link) DO NOTHING; 