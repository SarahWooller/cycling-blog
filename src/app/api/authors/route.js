import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

export async function GET() {
  try {
    const res = await fetch(`${FASTAPI_URL}/authors`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.detail || 'Failed to fetch authors' }, { status: res.status });
  } catch (err) {
    console.error('Error fetching authors:', err);
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }
}
