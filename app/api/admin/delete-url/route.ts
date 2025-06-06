import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';

export async function DELETE(request: NextRequest) {
  try {
    const { url, password } = await request.json();

    // Simple password protection (in production, use proper authentication)
    if (password !== 'admin123') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Delete URL from crawled_urls table
    DatabaseManager.deleteUrl(url);

    return NextResponse.json({
      success: true,
      message: 'URL deleted successfully'
    });

  } catch (error) {
    console.error('Delete URL API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 