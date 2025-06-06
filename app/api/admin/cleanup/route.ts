import { NextRequest, NextResponse } from 'next/server';
import { DatabaseManager } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Simple password protection (in production, use proper authentication)
    if (password !== 'admin123') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Clean up example data
    DatabaseManager.cleanupExampleData();

    return NextResponse.json({
      success: true,
      message: 'Example data cleaned up successfully'
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 