import { NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';

export async function GET() {
  try {
    const db = DatabaseManager.getInstance();
    const stats = await db.getStats();
    const fileTypes = await db.getFileTypes();

    return NextResponse.json({
      success: true,
      stats,
      fileTypes
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 