import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ 
        success: false, 
        error: 'URL is required' 
      }, { status: 400 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPOSITORY || 'hybridx/WebScraper'; // format: owner/repo
    
    if (!githubToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'GitHub token not configured' 
      }, { status: 500 });
    }

    // Trigger GitHub workflow via repository_dispatch
    const response = await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'WebScraper-App'
      },
      body: JSON.stringify({
        event_type: 'crawl-request',
        client_payload: {
          url: url,
          source: 'webapp',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to trigger workflow',
        details: errorText
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Crawl workflow triggered successfully',
      url: url,
      workflow_url: `https://github.com/${githubRepo}/actions`,
      estimated_duration: '2-3 minutes'
    });

  } catch (error: any) {
    console.error('Trigger crawl error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 