-- Create links table
CREATE TABLE IF NOT EXISTS public.links (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    title TEXT,
    file_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP WITH TIME ZONE,
    parent_url TEXT,
    status TEXT DEFAULT 'pending'
);

-- Create crawled_urls table for tracking
CREATE TABLE IF NOT EXISTS public.crawled_urls (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_crawled TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create error_urls table for failed crawls
CREATE TABLE IF NOT EXISTS public.error_urls (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_links_url ON public.links(url);
CREATE INDEX IF NOT EXISTS idx_links_file_type ON public.links(file_type);
CREATE INDEX IF NOT EXISTS idx_links_status ON public.links(status);
CREATE INDEX IF NOT EXISTS idx_crawled_urls_url ON public.crawled_urls(url);

-- Enable Row Level Security
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawled_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_urls ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON public.links
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.crawled_urls
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.error_urls
    FOR SELECT USING (true);

-- Create policies for authenticated users (admin operations)
CREATE POLICY "Enable all access for authenticated users" ON public.links
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.crawled_urls
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON public.error_urls
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function for file type grouping
CREATE OR REPLACE FUNCTION get_file_type_counts()
RETURNS TABLE (
    file_type TEXT,
    count BIGINT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        COALESCE(file_type, 'unknown') as file_type,
        COUNT(*) as count
    FROM public.links
    GROUP BY file_type
    ORDER BY count DESC;
$$; 