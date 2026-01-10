import { NextRequest, NextResponse } from 'next/server';

// Server-side proxy can call HTTP without mixed-content issues
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://rental-room-api.southeastasia.azurecontainer.io:3000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;
  
  const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${queryString}`;
  
  try {
    const body = await request.json().catch(() => ({}));
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;
  
  const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${queryString}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;
  
  const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${queryString}`;
  
  try {
    const body = await request.json().catch(() => ({}));
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join('/');
  const url = new URL(request.url);
  const queryString = url.search;
  
  const targetUrl = `${BACKEND_URL}/api/v1/${pathStr}${queryString}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
