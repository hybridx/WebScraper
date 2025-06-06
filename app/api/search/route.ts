import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Allow empty query to return all results
    if (!query && type === 'all') {
      // If no query and no type filter, return recent results
    }

    const db = DatabaseManager.getInstance();
    const links = await db.searchLinks(query, type, limit);
    
    return NextResponse.json({
      success: true,
      results: links,
      count: links.length
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 