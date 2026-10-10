import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_URL}/tours`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.detail || 'Failed to fetch tours' }, { status: res.status });
  } catch (err) {
    console.error('Error fetching tours:', err);
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }
}

export async function POST(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const res = await fetch(`${FASTAPI_URL}/tours`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, { status: 201 });
    }
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.detail || 'Failed to create tour' }, { status: res.status });
  } catch (err) {
    console.error('Error creating tour:', err);
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }
}
