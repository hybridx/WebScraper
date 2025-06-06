import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

async function applySchema() {
  // Create Supabase client with service role key for admin operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Read the migration SQL
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Error applying schema:', error)
      process.exit(1)
    }

    console.log('✅ Schema applied successfully')
  } catch (err) {
    console.error('Failed to apply schema:', err)
    process.exit(1)
  }
}

applySchema() 