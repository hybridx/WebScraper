const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');

// Local SQLite database
const db = new Database('./database.db');

// Production Supabase (you'll need to set these env vars)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function transferData() {
  try {
    console.log('🔄 Starting data transfer...');
    
    // Get all unique links from local SQLite (avoiding duplicates)
    const localLinks = db.prepare(`
      SELECT DISTINCT name, link, type 
      FROM links 
      WHERE name LIKE '%.mp3' OR name LIKE '%.txt'
      ORDER BY name
    `).all();
    
    console.log(`📊 Found ${localLinks.length} unique files in local database`);
    
    // Clear existing data in production
    await supabase.from('links').delete().neq('id', 0);
    console.log('🗑️ Cleared production database');
    
    // Insert into production Supabase
    const { data, error } = await supabase
      .from('links')
      .insert(localLinks);
      
    if (error) {
      console.error('❌ Error inserting data:', error);
      return;
    }
    
    console.log(`✅ Successfully transferred ${localLinks.length} files to production`);
    
    // Verify transfer
    const { data: verifyData, error: verifyError } = await supabase
      .from('links')
      .select('count(*)', { count: 'exact' });
      
    if (!verifyError) {
      console.log(`🔍 Production database now contains ${verifyData.length} files`);
    }
    
  } catch (error) {
    console.error('💥 Transfer failed:', error);
  }
}

transferData(); 