import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';

// Public crawler endpoint - no auth required
export async function POST(request: NextRequest) {
  try {
    const { url, secret } = await request.json();
    
    // Simple secret key protection
    if (secret !== process.env.CRAWLER_SECRET) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid secret' 
      }, { status: 401 });
    }

    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL is required' 
      }, { status: 400 });
    }

    const db = DatabaseManager.getInstance();
    await db.initialize();

    // Use regex parsing for production (no JSDOM)
    const response = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 WebScraper' },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Regex parsing (production-compatible)
    const linkPattern = /<a[^>]*href=["']([^"']*?)["'][^>]*>([^<]*?)<\/a>/gi;
    const links: Array<{name: string, link: string, type: string}> = [];
    let match;

    while ((match = linkPattern.exec(html)) !== null) {
      const href = match[1];
      const name = match[2].trim();
      
      if (name && !name.includes('Parent Directory') && !href.startsWith('?') && !href.startsWith('/')) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).toString();
        const fileType = getFileType(name);
        
        links.push({
          name: decodeURIComponent(name),
          link: fullUrl,
          type: fileType
        });
      }
    }

    // Store in database
    let stored = 0;
    for (const link of links) {
      try {
        await db.addLink(link.name, link.link, link.type);
        stored++;
      } catch (error) {
        // Skip duplicates
      }
    }

    return NextResponse.json({
      success: true,
      links_found: links.length,
      stored: stored,
      message: `Successfully crawled ${url}`,
      parsing_method: 'Regex'
    });

  } catch (error: any) {
    console.error('Public crawler error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

function getFileType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop() || '';
  
  const types: Record<string, string> = {
    // Audio
    'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',
    // Video  
    'mp4': 'video', 'avi': 'video', 'mkv': 'video', 'mov': 'video',
    // Images
    'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
    // Text
    'txt': 'text', 'pdf': 'text', 'doc': 'text', 'docx': 'text',
    // Compressed
    'zip': 'compressed', 'rar': 'compressed', '7z': 'compressed',
    // Executable
    'exe': 'executable', 'msi': 'executable', 'dmg': 'executable',
  };
  
  return types[ext] || 'other';
} 