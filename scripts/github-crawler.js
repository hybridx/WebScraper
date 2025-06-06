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

// Configuration
const MAX_DEPTH = parseInt(process.env.MAX_DEPTH) || 3;
const MAX_SUBDIRS_PER_LEVEL = 5;
const CRAWL_TIMEOUT = 30000; // 30 seconds per URL

// Crawl statistics
const crawlStats = {
  totalLinks: 0,
  totalDirs: 0,
  crawledUrls: new Set(),
  maxDepthReached: 0,
  errors: []
};

function isDirectory(href, text) {
  return (
    href.endsWith('/') ||                           // Classic directory indicator
    text.toLowerCase().includes('[dir]') ||         // Apache style
    text.toLowerCase().includes('folder') ||        // Common naming
    text.toLowerCase().includes('directory') ||     // Common naming
    (!href.includes('.') && !href.includes('?'))    // No extension, no query params
  );
}

function normalizeUrl(href, baseUrl) {
  try {
    // Handle relative URLs
    if (href.startsWith('./')) {
      href = href.substring(2);
    }
    
    // If it's already a complete URL, return as is
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }
    
    // Build complete URL
    const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const path = href.startsWith('/') ? href : '/' + href;
    
    return base + path;
  } catch (error) {
    console.error(`Error normalizing URL: ${href} with base ${baseUrl}`, error);
    return href;
  }
}

function getFileType(filename) {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  const types = {
    // Audio
    'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio', 'm4a': 'audio', 'ogg': 'audio',
    'wma': 'audio', 'aif': 'audio', 'mid': 'audio', 'midi': 'audio', 'mpa': 'audio', 'wpl': 'audio',
    // Video  
    'mp4': 'video', 'avi': 'video', 'mkv': 'video', 'mov': 'video', 'wmv': 'video', 'flv': 'video',
    'webm': 'video', '3gp': 'video', 'mpg': 'video', 'mpeg': 'video', 'm4v': 'video',
    // Images
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'bmp': 'image', 'svg': 'image',
    'webp': 'image', 'ico': 'image', 'tif': 'image', 'ai': 'image',
    // Text/Documents
    'txt': 'text', 'pdf': 'text', 'doc': 'text', 'docx': 'text', 'rtf': 'text', 'md': 'text',
    'readme': 'text', 'wpd': 'text', 'odt': 'text', 'wps': 'text', 'wks': 'text',
    // Compressed
    'zip': 'compressed', 'rar': 'compressed', '7z': 'compressed', 'tar': 'compressed', 'gz': 'compressed',
    'bz2': 'compressed', 'deb': 'compressed', 'pkg': 'compressed', 'arj': 'compressed',
    // Executable
    'exe': 'executable', 'msi': 'executable', 'dmg': 'executable', 'deb': 'executable', 'rpm': 'executable',
    'apk': 'executable', 'bat': 'executable', 'com': 'executable', 'jar': 'executable', 'py': 'executable', 'wsf': 'executable',
    // Disk Images
    'iso': 'disk', 'img': 'disk', 'dmg': 'disk', 'bin': 'disk', 'toast': 'disk', 'vcd': 'disk'
  };
  
  return types[ext] || 'other';
}

async function parseDirectoryListing(url) {
  try {
    console.log(`📡 Fetching: ${url}`);
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (GitHub Actions) WebScraper/2.0' },
      signal: AbortSignal.timeout(CRAWL_TIMEOUT)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`📄 Received ${html.length} characters of HTML`);

    // Parse links using enhanced regex
    const linkPattern = /<a[^>]*href=["']([^"']*?)["'][^>]*>([^<]*?)<\/a>/gi;
    const links = [];
    const subdirs = [];
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].trim();
      
      // Skip unwanted links
      if (!text || 
          text.includes('Parent Directory') || 
          text.includes('..') ||
          href === '../' || href === '.' || href === '/' ||
          href.startsWith('?') || 
          href.startsWith('#') ||
          href.startsWith('mailto:') ||
          href.includes('javascript:')) {
        continue;
      }

      // Clean up text (remove [DIR], [TXT] etc.)
      const cleanText = text.replace(/^\s*\[.*?\]\s*/, '').trim();
      const displayName = cleanText || decodeURIComponent(href);

      // Build full URL
      const fullUrl = normalizeUrl(href, url);

      if (isDirectory(href, text)) {
        // It's a subdirectory
        if (!subdirs.some(sub => sub.url === fullUrl)) {
          subdirs.push({
            name: displayName,
            url: fullUrl
          });
        }
      } else {
        // It's a file
        const fileType = getFileType(displayName);
        if (fileType !== 'other') {
          links.push({
            name: displayName,
            link: fullUrl,
            type: fileType
          });
        }
      }
    }

    // Remove duplicates
    const uniqueLinks = links.filter((link, index, arr) => 
      arr.findIndex(l => l.link === link.link) === index
    );

    const uniqueSubdirs = subdirs.filter((sub, index, arr) => 
      arr.findIndex(s => s.url === sub.url) === index
    );

    console.log(`✅ Found ${uniqueLinks.length} files and ${uniqueSubdirs.length} subdirectories`);
    return { links: uniqueLinks, subdirs: uniqueSubdirs };

  } catch (error) {
    console.error(`❌ Error parsing ${url}:`, error.message);
    throw error;
  }
}

async function crawlRecursively(url, currentDepth = 0) {
  // Check depth limit
  if (currentDepth >= MAX_DEPTH) {
    console.log(`🚫 Max depth ${MAX_DEPTH} reached at: ${url}`);
    crawlStats.maxDepthReached = Math.max(crawlStats.maxDepthReached, currentDepth);
    return;
  }

  // Check if already crawled (prevent infinite loops)
  if (crawlStats.crawledUrls.has(url)) {
    console.log(`🔄 Already crawled: ${url}`);
    return;
  }

  crawlStats.crawledUrls.add(url);
  console.log(`📁 Crawling depth ${currentDepth}: ${url}`);

  try {
    // Parse current directory
    const { links, subdirs } = await parseDirectoryListing(url);
    
    // Store files found at this level
    if (links.length > 0) {
      await storeLinksInDatabase(links);
      crawlStats.totalLinks += links.length;
      console.log(`✅ Stored ${links.length} files from depth ${currentDepth}`);
    }

    crawlStats.totalDirs += 1;
    crawlStats.maxDepthReached = Math.max(crawlStats.maxDepthReached, currentDepth);

    // Recursively crawl subdirectories (if not at max depth)
    if (currentDepth < MAX_DEPTH - 1 && subdirs.length > 0) {
      console.log(`🔍 Found ${subdirs.length} subdirectories, crawling...`);
      
      // Limit subdirectories to prevent timeout
      const subdirsToProcess = subdirs.slice(0, MAX_SUBDIRS_PER_LEVEL);
      
      for (const subdir of subdirsToProcess) {
        try {
          await crawlRecursively(subdir.url, currentDepth + 1);
        } catch (error) {
          console.error(`❌ Error crawling subdirectory ${subdir.url}:`, error.message);
          crawlStats.errors.push({
            url: subdir.url,
            error: error.message,
            depth: currentDepth + 1
          });
          
          // Store error in database
          try {
            await supabase.from('error_urls').insert({
              url: subdir.url,
              error_message: error.message
            });
          } catch (dbError) {
            console.warn('⚠️ Could not store error URL:', dbError.message);
          }
        }
      }
      
      if (subdirs.length > MAX_SUBDIRS_PER_LEVEL) {
        console.log(`⚠️ Limited to first ${MAX_SUBDIRS_PER_LEVEL} subdirectories to prevent timeout`);
      }
    }

  } catch (error) {
    console.error(`❌ Error crawling ${url}:`, error.message);
    crawlStats.errors.push({
      url: url,
      error: error.message,
      depth: currentDepth
    });
    throw error;
  }
}

async function storeLinksInDatabase(links) {
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

  if (duplicates > 0) {
    console.log(`🔄 Skipped ${duplicates} duplicate files`);
  }
  
  return { stored, duplicates };
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

async function crawlAndStore() {
  const url = process.env.CRAWL_URL;
  const source = process.env.SOURCE || 'github-action';
  const recursive = process.env.RECURSIVE !== 'false'; // Default to true
  
  if (!url) {
    console.error('❌ No URL provided');
    process.exit(1);
  }

  console.log(`🚀 Starting ${recursive ? 'recursive' : 'single-level'} crawl of: ${url}`);
  console.log(`📏 Max depth: ${recursive ? MAX_DEPTH : 1}`);
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

    // Start crawling
    if (recursive) {
      console.log('🕷️ Starting recursive crawl...');
      await crawlRecursively(url, 0);
    } else {
      console.log('🕷️ Starting single-level crawl...');
      const { links } = await parseDirectoryListing(url);
      
      if (links.length > 0) {
        await storeLinksInDatabase(links);
        crawlStats.totalLinks = links.length;
        crawlStats.totalDirs = 1;
        crawlStats.maxDepthReached = 0;
      }
    }

    // Update crawl status
    await updateCrawlStatus(url, 'completed');

    // Final summary
    console.log('\n🎉 Crawl Summary:');
    console.log(`├── 🔗 URL: ${url}`);
    console.log(`├── 📁 Total files found: ${crawlStats.totalLinks}`);
    console.log(`├── 📂 Directories crawled: ${crawlStats.totalDirs}`);
    console.log(`├── 🌊 URLs processed: ${crawlStats.crawledUrls.size}`);
    console.log(`├── 📏 Max depth reached: ${crawlStats.maxDepthReached}`);
    console.log(`├── ❌ Errors encountered: ${crawlStats.errors.length}`);
    console.log(`├── 🔄 Recursive mode: ${recursive ? 'Enabled' : 'Disabled'}`);
    console.log(`└── 📱 Source: ${source}`);

    // Log errors if any
    if (crawlStats.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      crawlStats.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error.url} (depth ${error.depth}): ${error.error}`);
      });
    }

    // Log some example files
    if (crawlStats.totalLinks > 0) {
      // Get a sample of stored files for display
      const { data: sampleFiles } = await supabase
        .from('links')
        .select('name, type')
        .limit(5);
      
      if (sampleFiles && sampleFiles.length > 0) {
        console.log('\n📄 Sample files stored:');
        sampleFiles.forEach((file, i) => {
          console.log(`${i + 1}. ${file.name} (${file.type})`);
        });
        if (crawlStats.totalLinks > 5) {
          console.log(`   ... and ${crawlStats.totalLinks - 5} more files`);
        }
      }
    }

  } catch (error) {
    console.error('💥 Crawl failed:', error.message);
    await updateCrawlStatus(url, 'error', error.message);
    process.exit(1);
  }
}

// Run the crawler
crawlAndStore(); 