import { NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';

export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    const urls = await db.getCrawledUrls();
    
    return NextResponse.json({
      success: true,
      urls
    });

  } catch (error) {
    console.error('Get URLs API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 