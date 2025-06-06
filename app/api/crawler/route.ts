import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';

// Dynamic imports for local development only
let JSDOM: any;
let jsdomAvailable = false;

// Only try to load JSDOM in development
if (process.env.NODE_ENV === 'development') {
  try {
    const jsdomModule = require('jsdom');
    JSDOM = jsdomModule.JSDOM;
    jsdomAvailable = true;
    console.log('JSDOM loaded for development');
  } catch (error) {
    console.log('JSDOM not available, using regex parsing');
    jsdomAvailable = false;
  }
}

interface ExtractedLink {
  name: string;
  link: string;
  type: string;
}

interface CrawlResult {
  links: ExtractedLink[];
  subdirs: string[];
}

interface CrawlStats {
  totalLinks: number;
  totalDirs: number;
  crawledUrls: Set<string>;
  maxDepthReached: number;
}

function classifyFileType(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.match(/\.(mp4|mkv|3gp|avi|mov|mpg|mpeg|wmv|m4v|webm|flv)$/)) {
    return "video";
  } else if (urlLower.match(/\.(mp3|aif|mid|midi|mpa|ogg|wav|wma|wpl|aac|flac|m4a)$/)) {
    return "audio";
  } else if (urlLower.match(/\.(rar|zip|deb|pkg|tar\.gz|7z|arj|bz2|gz|tar)$/)) {
    return "compressed";
  } else if (urlLower.match(/\.(bin|dmg|iso|toast|vcd|img)$/)) {
    return "disk";
  } else if (urlLower.match(/\.(exe|apk|bat|com|jar|py|wsf|msi|deb|rpm)$/)) {
    return "executable";
  } else if (urlLower.match(/\.(ai|bmp|gif|ico|jpeg|png|jpg|tif|svg|webp)$/)) {
    return "image";
  } else if (urlLower.match(/\.(pdf|txt|doc|rtf|wpd|docx|odt|wps|wks|md|readme)$/)) {
    return "text";
  } else {
    return "other";
  }
}

function isDirectory(href: string, text: string): boolean {
  // Enhanced directory detection
  return (
    href.endsWith('/') ||                           // Classic directory indicator
    text.toLowerCase().includes('[dir]') ||         // Apache style
    text.toLowerCase().includes('folder') ||        // Common naming
    text.toLowerCase().includes('directory') ||     // Common naming
    (!href.includes('.') && !href.includes('?'))    // No extension, no query params
  );
}

function normalizeUrl(href: string, baseUrl: string): string {
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

function parseWithJSDOM(html: string, baseUrl: string): CrawlResult {
  if (!jsdomAvailable) {
    throw new Error('JSDOM not available');
  }

  const extractedLinks: ExtractedLink[] = [];
  const subdirectories: string[] = [];
  
  try {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const links = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[];

    for (const linkElement of links) {
      const href = linkElement.getAttribute('href');
      if (!href) continue;

      // Skip unwanted links
      if (href === '../' || href === '.' || href === '/' || 
          href.startsWith('?') || href.startsWith('#') || 
          href.startsWith('mailto:') || href.includes('javascript:')) {
        continue;
      }

      const text = linkElement.textContent || href;
      const completeLink = normalizeUrl(href, baseUrl);

      if (isDirectory(href, text)) {
        // It's a subdirectory
        if (!subdirectories.includes(completeLink)) {
          subdirectories.push(completeLink);
        }
      } else {
        // It's a file
        const fileType = classifyFileType(completeLink);
        if (fileType !== "other") {
          extractedLinks.push({
            name: text.trim(),
            link: completeLink,
            type: fileType
          });
        }
      }
    }

    console.log(`JSDOM parsed ${extractedLinks.length} files and ${subdirectories.length} subdirectories`);
    return { links: extractedLinks, subdirs: subdirectories };
  } catch (error) {
    console.error('JSDOM parsing failed:', error);
    throw error;
  }
}

function parseWithRegex(html: string, baseUrl: string): CrawlResult {
  const extractedLinks: ExtractedLink[] = [];
  const subdirectories: string[] = [];
  
  // Enhanced regex pattern for directory listings
  const linkPattern = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)/gi;
  
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    let text = match[2];
    
    // Skip unwanted links
    if (!href || href === '../' || href === '.' || href === '/' || 
        href.startsWith('?') || href.startsWith('http') || href.startsWith('//') || 
        href.startsWith('#') || href.startsWith('mailto:') || href.includes('javascript:')) {
      continue;
    }

    // Clean up the text
    text = text.replace(/^\s*\[.*?\]\s*/, '').trim(); // Remove [DIR], [TXT] etc.
    if (!text || text === href) {
      text = decodeURIComponent(href);
    }

    const completeLink = normalizeUrl(href, baseUrl);

    if (isDirectory(href, text)) {
      // It's a subdirectory
      if (!subdirectories.includes(completeLink)) {
        subdirectories.push(completeLink);
      }
    } else {
      // It's a file
      const fileType = classifyFileType(completeLink);
      if (fileType !== "other") {
        extractedLinks.push({
          name: text.trim(),
          link: completeLink,
          type: fileType
        });
      }
    }
  }

  // Remove duplicates
  const uniqueLinks = extractedLinks.filter((link, index, arr) => 
    arr.findIndex(l => l.link === link.link) === index
  );

  const uniqueSubdirs = Array.from(new Set(subdirectories));

  console.log(`Regex parsed ${uniqueLinks.length} files and ${uniqueSubdirs.length} subdirectories`);
  return { links: uniqueLinks, subdirs: uniqueSubdirs };
}

async function crawlDirectoryListing(url: string): Promise<CrawlResult> {
  try {
    console.log(`Fetching URL: ${url}`);
    
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutMs = isProduction ? 8000 : 15000; // Conservative timeout for Vercel
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`Received ${html.length} characters of HTML`);
    
    // Use JSDOM only for local development
    if (jsdomAvailable && process.env.NODE_ENV === 'development') {
      console.log('Using JSDOM parsing (development)');
      return parseWithJSDOM(html, url);
    } else {
      console.log('Using regex parsing (production)');
      return parseWithRegex(html, url);
    }
    
  } catch (error) {
    console.error(`Error crawling ${url}:`, error);
    throw error;
  }
}

async function crawlRecursively(
  startUrl: string, 
  maxDepth: number = 3, 
  currentDepth: number = 0, 
  stats: CrawlStats = { totalLinks: 0, totalDirs: 0, crawledUrls: new Set(), maxDepthReached: 0 },
  db: DatabaseManager
): Promise<CrawlStats> {
  
  // Check depth limit
  if (currentDepth >= maxDepth) {
    console.log(`🚫 Max depth ${maxDepth} reached, stopping recursion`);
    stats.maxDepthReached = Math.max(stats.maxDepthReached, currentDepth);
    return stats;
  }

  // Check if already crawled (prevent infinite loops)
  if (stats.crawledUrls.has(startUrl)) {
    console.log(`🔄 Already crawled ${startUrl}, skipping`);
    return stats;
  }

  stats.crawledUrls.add(startUrl);
  console.log(`📁 Crawling depth ${currentDepth}: ${startUrl}`);

  try {
    // Crawl current directory
    const result = await crawlDirectoryListing(startUrl);
    
    // Store files found at this level
    if (result.links.length > 0) {
      await db.addLinks(result.links);
      stats.totalLinks += result.links.length;
      console.log(`✅ Stored ${result.links.length} files from depth ${currentDepth}`);
    }

    stats.totalDirs += 1;
    stats.maxDepthReached = Math.max(stats.maxDepthReached, currentDepth);

    // Recursively crawl subdirectories (if not at max depth)
    if (currentDepth < maxDepth - 1 && result.subdirs.length > 0) {
      console.log(`🔍 Found ${result.subdirs.length} subdirectories, crawling...`);
      
      // Limit subdirectories to prevent timeout
      const maxSubdirs = process.env.NODE_ENV === 'production' ? 3 : 5;
      const subdirsToProcess = result.subdirs.slice(0, maxSubdirs);
      
      for (const subdir of subdirsToProcess) {
        try {
          await crawlRecursively(subdir, maxDepth, currentDepth + 1, stats, db);
        } catch (error) {
          console.error(`❌ Error crawling subdirectory ${subdir}:`, error);
          await db.addErrorUrl(subdir, String(error));
        }
      }
      
      if (result.subdirs.length > maxSubdirs) {
        console.log(`⚠️ Limited to first ${maxSubdirs} subdirectories to prevent timeout`);
      }
    }

    return stats;

  } catch (error) {
    console.error(`❌ Error crawling ${startUrl}:`, error);
    await db.addErrorUrl(startUrl, String(error));
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, maxDepth = 2, recursive = true } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    const effectiveMaxDepth = isProduction ? Math.min(maxDepth, 2) : Math.min(maxDepth, 4); // Limit depth in production
    
    console.log(`🚀 Starting ${recursive ? 'recursive' : 'single-level'} crawl of: ${url}`);
    console.log(`📏 Max depth: ${effectiveMaxDepth} (${isProduction ? 'production' : 'development'})`);

    // Test database connection first
    let db: DatabaseManager;
    try {
      db = DatabaseManager.getInstance();
      await db.initialize();
      console.log('✅ Database connection successful');
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return NextResponse.json({
        success: false,
        error: `Database connection failed: ${String(dbError)}`,
        setup_required: true
      }, { status: 500 });
    }

    // Add URL to crawled_urls if not exists
    try {
      await db.addCrawledUrl(url);
    } catch (error) {
      console.log('⚠️ URL already exists in crawled_urls table');
    }

    let stats: CrawlStats;

    if (recursive) {
      // Recursive crawling
      console.log('🕷️ Starting recursive directory crawl...');
      stats = await crawlRecursively(url, effectiveMaxDepth, 0, undefined, db);
    } else {
      // Single-level crawling (legacy behavior)
      console.log('🕷️ Starting single-level directory crawl...');
      const result = await crawlDirectoryListing(url);
      
      if (result.links.length > 0) {
        await db.addLinks(result.links);
      }
      
      stats = {
        totalLinks: result.links.length,
        totalDirs: 1,
        crawledUrls: new Set([url]),
        maxDepthReached: 0
      };
    }

    // Update URL status
    try {
      await db.updateCrawledUrlStatus(url, 'completed');
    } catch (statusError) {
      console.error('⚠️ Failed to update URL status:', statusError);
    }

    const response = {
      success: true,
      links_found: stats.totalLinks,
      directories_crawled: stats.totalDirs,
      urls_processed: stats.crawledUrls.size,
      max_depth_reached: stats.maxDepthReached,
      message: `Successfully crawled ${url} ${recursive ? 'recursively' : ''}`,
      parsing_method: jsdomAvailable && !isProduction ? 'JSDOM' : 'Regex',
      recursive_crawling: recursive,
      depth_limit: effectiveMaxDepth
    };

    console.log('🎉 Crawl completed:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Crawler API error:', error);
    return NextResponse.json(
      { 
        error: String(error),
        success: false 
      },
      { status: 500 }
    );
  }
} 