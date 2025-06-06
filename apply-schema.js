const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = "https://dvpsmdcxbaaxfwarjmkl.supabase.co"
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cHNtZGN4YmFheGZ3YXJqbWtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE5MzQ1OSwiZXhwIjoyMDY0NzY5NDU5fQ.qtaYujRLfJoYR-zpuRo_hfeZ1UgFD4C9oLqYLBFgpmo"

async function createTables() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  console.log('🔄 Creating database tables...')

  try {
    // Create the links table
    console.log('Creating links table...')
    const { error: linksError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.links (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          link TEXT NOT NULL,
          type TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    })

    if (linksError) {
      console.error('Error creating links table:', linksError)
      return
    }

    // Create the crawled_urls table
    console.log('Creating crawled_urls table...')
    const { error: crawledError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.crawled_urls (
          id SERIAL PRIMARY KEY,
          url TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'pending',
          crawled_at TIMESTAMP WITH TIME ZONE,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    })

    if (crawledError) {
      console.error('Error creating crawled_urls table:', crawledError)
      return
    }

    // Create the error_urls table
    console.log('Creating error_urls table...')
    const { error: errorError } = await supabase.rpc('exec', {
      query: `
        CREATE TABLE IF NOT EXISTS public.error_urls (
          id SERIAL PRIMARY KEY,
          url TEXT NOT NULL,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          attempts INTEGER DEFAULT 1
        );
      `
    })

    if (errorError) {
      console.error('Error creating error_urls table:', errorError)
      return
    }

    // Create indexes
    console.log('Creating indexes...')
    await supabase.rpc('exec', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_links_type ON public.links(type);
        CREATE INDEX IF NOT EXISTS idx_links_name ON public.links(name);
        CREATE INDEX IF NOT EXISTS idx_crawled_urls_status ON public.crawled_urls(status);
      `
    })

    // Create the file type counts function
    console.log('Creating RPC function...')
    await supabase.rpc('exec', {
      query: `
        CREATE OR REPLACE FUNCTION get_file_type_counts()
        RETURNS TABLE (
          type TEXT,
          count BIGINT
        )
        LANGUAGE SQL
        STABLE
        AS $$
          SELECT 
            COALESCE(type, 'unknown') as type,
            COUNT(*) as count
          FROM public.links
          GROUP BY type
          ORDER BY count DESC;
        $$;
      `
    })

    // Test the tables
    console.log('Testing tables...')
    const { data, error } = await supabase.from('links').select('count', { count: 'exact' })
    
    if (error) {
      console.error('Error testing tables:', error)
    } else {
      console.log('✅ Database setup complete!')
      console.log(`📊 Current links count: ${data?.length || 0}`)
    }

  } catch (error) {
    console.error('❌ Failed to create tables:', error)
  }
}

createTables() 