import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';
import { JSDOM } from 'jsdom';

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

function parseWithRegex(html: string, baseUrl: string): { links: ExtractedLink[], subdirs: string[] } {
  const extractedLinks: ExtractedLink[] = [];
  const subdirectories: string[] = [];
  
  // Regex to match href attributes in anchor tags
  const hrefRegex = /<a[^>]+href\s*=\s*['"](.*?)['"][^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim(); // Remove HTML tags from text
    
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
          name: text || href,
          link: completeLink,
          type: fileType
        });
      }
    }
  }
  
  return { links: extractedLinks, subdirs: subdirectories };
}

async function crawlDirectoryListing(url: string): Promise<{ links: ExtractedLink[], subdirs: string[] }> {
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
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
    
    // Try different parsing approaches for better compatibility
    let document;
    try {
      const dom = new JSDOM(html);
      document = dom.window.document;
    } catch (jsdomError) {
      console.log('JSDOM failed, trying manual parsing:', jsdomError);
      // Fallback to regex parsing if JSDOM fails
      return parseWithRegex(html, url);
    }
    
    const links = Array.from(document.querySelectorAll('a[href]'));
    const extractedLinks: ExtractedLink[] = [];
    const subdirectories: string[] = [];

    for (const linkElement of links) {
      const href = linkElement.getAttribute('href');
      if (!href) continue;

      // Skip parent directory links and absolute URLs
      if (href === '../' || href.startsWith('/') || href.startsWith('http')) {
        continue;
      }

      const completeLink = url.replace(/\/$/, '') + '/' + href;

      if (href.endsWith('/')) {
        // It's a subdirectory
        subdirectories.push(completeLink);
      } else {
        // It's a file
        const fileType = classifyFileType(completeLink);
        if (fileType !== "other") { // Only store media and document files
          extractedLinks.push({
            name: linkElement.textContent || href,
            link: completeLink,
            type: fileType
          });
        }
      }
    }

    return { links: extractedLinks, subdirs: subdirectories };
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

    console.log(`Starting crawl of: ${url}`);

    // Crawl the main URL
    const { links, subdirs } = await crawlDirectoryListing(url);

    // Store links in database
    const db = DatabaseManager.getInstance();
    if (links.length > 0) {
      await db.addLinks(links);
    }

    // Update URL status
    await db.updateCrawledUrlStatus(url, 'completed');

    // Crawl a limited number of subdirectories to prevent infinite recursion
    let subLinksCount = 0;
    for (const subdir of subdirs.slice(0, 3)) { // Limit to 3 subdirectories
      try {
        const { links: subLinks } = await crawlDirectoryListing(subdir);
        if (subLinks.length > 0) {
          await db.addLinks(subLinks);
          subLinksCount += subLinks.length;
        }
      } catch (error) {
        console.error(`Error crawling subdirectory ${subdir}:`, error);
        await db.addErrorUrl(subdir, String(error));
      }
    }

    const response = {
      success: true,
      links_found: links.length,
      subdirs_crawled: Math.min(subdirs.length, 3),
      total_links: links.length + subLinksCount,
      message: `Successfully crawled ${url}`
    };

    console.log('Crawl completed:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Crawler API error:', error);
    
    // Log error in database if URL was provided
    try {
      const { url } = await request.json();
      if (url) {
        const db = DatabaseManager.getInstance();
        await db.addErrorUrl(url, String(error));
        await db.updateCrawledUrlStatus(url, 'error', String(error));
      }
    } catch {
      // Ignore if we can't parse the request again
    }

    return NextResponse.json(
      { 
        error: String(error),
        success: false 
      },
      { status: 500 }
    );
  }
} 