import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in as a blogger or admin.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No GPX file provided' }, { status: 400 });
    }

    const filename = file.name || 'route.gpx';
    if (!filename.toLowerCase().endsWith('.gpx')) {
      return NextResponse.json({ error: 'Only .gpx files are allowed' }, { status: 400 });
    }

    // Forward multipart form data to FastAPI backend
    const backendFormData = new FormData();
    backendFormData.append('file', file, filename);

    const postSlug = formData.get('post_slug');
    if (postSlug) backendFormData.append('post_slug', postSlug);

    const postId = formData.get('post_id');
    if (postId) backendFormData.append('post_id', postId);

    const res = await fetch(`${FASTAPI_URL}/gpx/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: backendFormData
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || 'Failed to upload GPX file' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('GPX upload proxy error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
