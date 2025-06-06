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

function classifyFileType(url: string): string {
  const urlLower = url.toLowerCase();
  
  if (urlLower.match(/\.(mp4|mkv|3gp|avi|mov|mpg|mpeg|wmv|m4v)$/)) {
    return "video";
  } else if (urlLower.match(/\.(mp3|aif|mid|midi|mpa|ogg|wav|wma|wpl)$/)) {
    return "audio";
  } else if (urlLower.match(/\.(rar|zip|deb|pkg|tar\.gz|7z|arj)$/)) {
    return "compressed";
  } else if (urlLower.match(/\.(bin|dmg|iso|toast|vcd)$/)) {
    return "disk";
  } else if (urlLower.match(/\.(exe|apk|bat|com|jar|py|wsf)$/)) {
    return "executable";
  } else if (urlLower.match(/\.(ai|bmp|gif|ico|jpeg|png|jpg|tif|svg)$/)) {
    return "image";
  } else if (urlLower.match(/\.(pdf|txt|doc|rtf|wpd|docx|odt|wps|wks)$/)) {
    return "text";
  } else {
    return "other";
  }
}

function parseWithJSDOM(html: string, baseUrl: string): { links: ExtractedLink[], subdirs: string[] } {
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

      // Skip parent directory links and absolute URLs
      if (href === '../' || href.startsWith('/') || href.startsWith('http')) {
        continue;
      }

      const completeLink = baseUrl.replace(/\/$/, '') + '/' + href;

      if (href.endsWith('/')) {
        // It's a subdirectory
        subdirectories.push(completeLink);
      } else {
        // It's a file
        const fileType = classifyFileType(completeLink);
        if (fileType !== "other") {
          extractedLinks.push({
            name: linkElement.textContent || href,
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

function parseWithRegex(html: string, baseUrl: string): { links: ExtractedLink[], subdirs: string[] } {
  const extractedLinks: ExtractedLink[] = [];
  const subdirectories: string[] = [];
  
  // Robust regex pattern for Apache directory listings
  const linkPattern = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]+)/gi;
  
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    let text = match[2];
    
    // Skip unwanted links
    if (!href || href === '../' || href === '/' || href.startsWith('?') || 
        href.startsWith('http') || href.startsWith('//') || 
        href.startsWith('#') || href.startsWith('mailto:') ||
        href.includes('javascript:')) {
      continue;
    }

    // Clean up the text
    text = text.replace(/^\s*\[.*?\]\s*/, '').trim(); // Remove [DIR], [TXT] etc.
    if (!text || text === href) {
      text = decodeURIComponent(href);
    }

    const completeLink = baseUrl.replace(/\/$/, '') + '/' + href;

    if (href.endsWith('/')) {
      // It's a subdirectory
      subdirectories.push(completeLink);
    } else {
      // It's a file
      const fileType = classifyFileType(completeLink);
      if (fileType !== "other") {
        extractedLinks.push({
          name: text,
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

async function crawlDirectoryListing(url: string): Promise<{ links: ExtractedLink[], subdirs: string[] }> {
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

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

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
    console.log(`🚀 Starting crawl of: ${url} (${isProduction ? 'production' : 'development'})`);

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

    // Crawl the main URL
    console.log('🕷️ Starting directory crawl...');
    let links, subdirs;
    try {
      const crawlResult = await crawlDirectoryListing(url);
      links = crawlResult.links;
      subdirs = crawlResult.subdirs;
      console.log(`✅ Crawl successful: found ${links.length} files and ${subdirs.length} subdirectories`);
    } catch (crawlError) {
      console.error('❌ Crawling failed:', crawlError);
      return NextResponse.json({
        success: false,
        error: `Failed to crawl URL: ${String(crawlError)}`,
        crawl_error: true
      }, { status: 500 });
    }

    // Store links in database
    if (links.length > 0) {
      try {
        await db.addLinks(links);
        console.log(`✅ Successfully stored ${links.length} links in database`);
      } catch (storeError) {
        console.error('❌ Failed to store links:', storeError);
        return NextResponse.json({
          success: false,
          error: `Failed to store links in database: ${String(storeError)}`,
          storage_error: true
        }, { status: 500 });
      }
    }

    // Update URL status
    try {
      await db.updateCrawledUrlStatus(url, 'completed');
    } catch (statusError) {
      console.error('⚠️ Failed to update URL status:', statusError);
      // Don't return error here, links were stored successfully
    }

    // Skip subdirectories in production to avoid timeout
    let subLinksCount = 0;
    if (!isProduction && subdirs.length > 0) {
      for (const subdir of subdirs.slice(0, 2)) {
        try {
          const { links: subLinks } = await crawlDirectoryListing(subdir);
          if (subLinks.length > 0) {
            await db.addLinks(subLinks);
            subLinksCount += subLinks.length;
          }
        } catch (error) {
          console.error(`❌ Error crawling subdirectory ${subdir}:`, error);
          await db.addErrorUrl(subdir, String(error));
        }
      }
    }

    const response = {
      success: true,
      links_found: links.length,
      subdirs_found: subdirs.length,
      total_links: links.length + subLinksCount,
      message: `Successfully crawled ${url}`,
      parsing_method: jsdomAvailable && !isProduction ? 'JSDOM' : 'Regex'
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