const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = "https://dvpsmdcxbaaxfwarjmkl.supabase.co"
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2cHNtZGN4YmFheGZ3YXJqbWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxOTM0NTksImV4cCI6MjA2NDc2OTQ1OX0.ZLYO4enTWvzes0mvTAsVcp3ARZ4n8hy87hVN0RsVHL4"

async function testSupabase() {
  console.log('🔄 Testing Supabase connection...')
  
  const supabase = createClient(SUPABASE_URL, ANON_KEY)

  try {
    // Test basic connection
    console.log('1. Testing basic connection...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('_supabase_health_check')
      .select('*')
      .limit(1)

    if (healthError && !healthError.message.includes('does not exist')) {
      console.error('❌ Connection failed:', healthError)
      return
    }
    console.log('✅ Connection successful')

    // Check if links table exists
    console.log('2. Checking if links table exists...')
    const { data: linksData, error: linksError } = await supabase
      .from('links')
      .select('count', { count: 'exact' })
      .limit(1)

    if (linksError) {
      console.error('❌ Links table error:', linksError)
      console.log('💡 This means the table was not created successfully')
      
      // Try to list all tables
      console.log('3. Attempting to list existing tables...')
      const { data: tablesData, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      if (tablesData) {
        console.log('📋 Existing tables:', tablesData.map(t => t.table_name))
      } else {
        console.log('⚠️ Could not list tables:', tablesError)
      }

    } else {
      console.log('✅ Links table exists!')
      console.log(`📊 Current links count: ${linksData?.[0]?.count || 0}`)

      // Test other tables
      console.log('3. Testing other tables...')
      
      const { error: crawledError } = await supabase
        .from('crawled_urls')
        .select('count', { count: 'exact' })
        .limit(1)

      if (crawledError) {
        console.error('❌ crawled_urls table:', crawledError.message)
      } else {
        console.log('✅ crawled_urls table exists')
      }

      const { error: errorUrlsError } = await supabase
        .from('error_urls')
        .select('count', { count: 'exact' })
        .limit(1)

      if (errorUrlsError) {
        console.error('❌ error_urls table:', errorUrlsError.message)
      } else {
        console.log('✅ error_urls table exists')
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSupabase() 