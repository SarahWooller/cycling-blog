import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

export async function GET(request, { params }) {
  const { slug } = await params;
  const authHeader = request.headers.get('authorization');

  try {
    const headers = {};
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${FASTAPI_URL}/posts/${encodeURIComponent(slug)}`, {
      headers,
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      const normalizedData = {
        ...data,
        routeMapUrl: data.route_map_url || data.routeMapUrl,
        docUrl: data.doc_url || data.docUrl,
        photosAlbumUrl: data.photos_album_url || data.photosAlbumUrl,
        backdropIndex: data.backdrop_index !== undefined ? data.backdrop_index : data.backdropIndex,
        backdropPhotoUrl: data.backdrop_photo_url || data.backdropPhotoUrl,
        gpxUrl: data.gpx_url || data.gpxUrl,
      };
      return NextResponse.json(normalizedData);
    }

    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: err.detail || 'Post not found' }, { status: res.status });
  } catch (err) {
    console.error(`FastAPI error fetching ${slug}:`, err.message);
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }
}

export async function PUT(request, { params }) {
  const { slug } = await params;
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json(
      { error: 'Authentication required. Please sign in as a blogger or administrator.' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const normalizedBody = {
    ...body,
    route_map_url: body.route_map_url !== undefined ? body.route_map_url : body.routeMapUrl,
    doc_url: body.doc_url !== undefined ? body.doc_url : body.docUrl,
    photos_album_url: body.photos_album_url !== undefined ? body.photos_album_url : body.photosAlbumUrl,
    backdrop_index: body.backdrop_index !== undefined ? body.backdrop_index : body.backdropIndex,
  };

  try {
    const res = await fetch(`${FASTAPI_URL}/posts/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(normalizedBody)
    });

    if (res.ok) {
      const updatedPost = await res.json();
      return NextResponse.json({ success: true, post: updatedPost });
    } else {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail || 'Failed to update post' }, { status: res.status });
    }
  } catch (err) {
    console.error(`FastAPI error updating ${slug}:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { slug } = await params;
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const res = await fetch(`${FASTAPI_URL}/posts/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      headers: { 'Authorization': authHeader }
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    } else {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.detail || 'Failed to delete post' }, { status: res.status });
    }
  } catch (err) {
    console.error(`FastAPI error deleting ${slug}:`, err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
