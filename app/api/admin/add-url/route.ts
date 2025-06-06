import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { url, password } = await request.json();

    // Simple password protection (in production, use proper authentication)
    if (password !== 'admin123') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Add URL to crawl queue
    DatabaseManager.addUrlToCrawl(url);

    return NextResponse.json({
      success: true,
      message: 'URL added to crawl queue successfully'
    });

  } catch (error) {
    console.error('Add URL API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 