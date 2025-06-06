const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function crawlAndStore() {
  const url = process.env.CRAWL_URL;
  const source = process.env.SOURCE || 'github-action';
  
  if (!url) {
    console.error('❌ No URL provided');
    process.exit(1);
  }

  console.log(`🚀 Starting crawl of: ${url}`);
  console.log(`📱 Source: ${source}`);
  console.log(`🌐 Using Supabase: ${supabaseUrl}`);

  try {
    // Test Supabase connection
    const { error: testError } = await supabase.from('links').select('count').limit(1);
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      process.exit(1);
    }
    console.log('✅ Supabase connection successful');

    // Add URL to crawled_urls table
    const { error: urlError } = await supabase
      .from('crawled_urls')
      .insert({ url, status: 'pending' });
    
    if (urlError && !urlError.message.includes('duplicate')) {
      console.warn('⚠️ Could not add URL to crawled_urls:', urlError.message);
    }

    // Fetch the URL
    console.log('🕷️ Fetching URL content...');
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (GitHub Actions) WebScraper/1.0' },
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`📄 Received ${html.length} characters of HTML`);

    // Parse links using regex (GitHub Actions compatible)
    const linkPattern = /<a[^>]*href=["']([^"']*?)["'][^>]*>([^<]*?)<\/a>/gi;
    const links = [];
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1];
      const name = match[2].trim();
      
      // Skip unwanted links
      if (!name || 
          name.includes('Parent Directory') || 
          name.includes('..') ||
          href.startsWith('?') || 
          href.startsWith('/') ||
          href.startsWith('#') ||
          href.startsWith('mailto:')) {
        continue;
      }

      // Build full URL
      const fullUrl = href.startsWith('http') ? href : new URL(href, url).toString();
      const fileType = getFileType(name);
      
      links.push({
        name: decodeURIComponent(name),
        link: fullUrl,
        type: fileType
      });
    }

    console.log(`📁 Found ${links.length} potential files`);

    if (links.length === 0) {
      console.log('⚠️ No files found to crawl');
      await updateCrawlStatus(url, 'completed', 'No files found');
      return;
    }

    // Store links in database
    console.log('💾 Storing links in database...');
    let stored = 0;
    let duplicates = 0;

    for (const link of links) {
      try {
        const { error } = await supabase
          .from('links')
          .insert(link);
        
        if (error) {
          if (error.message.includes('duplicate') || error.code === '23505') {
            duplicates++;
          } else {
            console.error(`❌ Error storing ${link.name}:`, error.message);
          }
        } else {
          stored++;
        }
      } catch (error) {
        console.error(`❌ Error storing ${link.name}:`, error.message);
      }
    }

    // Update crawl status
    await updateCrawlStatus(url, 'completed');

    // Summary
    console.log('\n🎉 Crawl Summary:');
    console.log(`├── 🔗 URL: ${url}`);
    console.log(`├── 📁 Files found: ${links.length}`);
    console.log(`├── ✅ Stored: ${stored}`);
    console.log(`├── 🔄 Duplicates: ${duplicates}`);
    console.log(`└── 📱 Source: ${source}`);

    // Log some example files
    if (stored > 0) {
      console.log('\n📄 Sample files stored:');
      links.slice(0, 5).forEach((link, i) => {
        console.log(`${i + 1}. ${link.name} (${link.type})`);
      });
      if (links.length > 5) {
        console.log(`   ... and ${links.length - 5} more files`);
      }
    }

  } catch (error) {
    console.error('💥 Crawl failed:', error.message);
    await updateCrawlStatus(url, 'error', error.message);
    process.exit(1);
  }
}

async function updateCrawlStatus(url, status, errorMessage = null) {
  try {
    const { error } = await supabase
      .from('crawled_urls')
      .update({ 
        status, 
        crawled_at: new Date().toISOString(),
        error_message: errorMessage 
      })
      .eq('url', url);
    
    if (error) {
      console.warn('⚠️ Could not update crawl status:', error.message);
    }
  } catch (error) {
    console.warn('⚠️ Could not update crawl status:', error.message);
  }
}

function getFileType(filename) {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  const types = {
    // Audio
    'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio', 'm4a': 'audio', 'ogg': 'audio',
    // Video  
    'mp4': 'video', 'avi': 'video', 'mkv': 'video', 'mov': 'video', 'wmv': 'video', 'flv': 'video',
    // Images
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'bmp': 'image', 'svg': 'image',
    // Text/Documents
    'txt': 'text', 'pdf': 'text', 'doc': 'text', 'docx': 'text', 'rtf': 'text', 'md': 'text',
    // Compressed
    'zip': 'compressed', 'rar': 'compressed', '7z': 'compressed', 'tar': 'compressed', 'gz': 'compressed',
    // Executable
    'exe': 'executable', 'msi': 'executable', 'dmg': 'executable', 'deb': 'executable', 'rpm': 'executable',
    // Disk Images
    'iso': 'disk', 'img': 'disk', 'dmg': 'disk'
  };
  
  return types[ext] || 'other';
}

// Run the crawler
crawlAndStore(); 