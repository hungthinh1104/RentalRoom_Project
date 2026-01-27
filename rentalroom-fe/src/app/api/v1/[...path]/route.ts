import { NextRequest, NextResponse } from 'next/server';

// Local/production proxy for /api/v1/* to backend API
const BACKEND_URL = process.env.BACKEND_API_URL || 'https://rental-room-api.azurewebsites.net';

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
    const headers: Record<string, string> = {
      'Cookie': request.headers.get('cookie') || '',
    };
    // Pass through Authorization header for authenticated requests
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    };
    // Pass through Authorization header for authenticated requests
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cookie': request.headers.get('cookie') || '',
    };
    // Pass through Authorization header for authenticated requests
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
    const headers: Record<string, string> = {
      'Cookie': request.headers.get('cookie') || '',
    };
    // Pass through Authorization header for authenticated requests
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}