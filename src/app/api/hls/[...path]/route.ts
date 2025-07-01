import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const hlsBaseUrl = process.env.NEXT_PUBLIC_HLS_BASE_URL || 'http://3.38.58.133/hls';
  const url = `${hlsBaseUrl}/${path}`;

  console.log('🔍 HLS 프록시 요청:', { url, path });

  try {
    // URL이 HTTP인지 HTTPS인지 확인하여 적절한 agent 사용
    const isHttps = url.startsWith('https://');
    const agent = isHttps 
      ? new (require('https').Agent)({ rejectUnauthorized: false })
      : new (require('http').Agent)();
    
    const response = await fetch(url, {
      // @ts-ignore
      agent
    });
    
    console.log('📡 HLS 프록시 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    });

    if (!response.ok) {
      console.error('❌ HLS 프록시 오류:', response.status, response.statusText);
      return new NextResponse('Stream not found', { status: 404 });
    }

    const contentType = response.headers.get('content-type') || 'application/vnd.apple.mpegurl';
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ HLS 프록시 오류:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 