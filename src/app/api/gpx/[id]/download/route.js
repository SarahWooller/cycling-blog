import { NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const res = await fetch(`${FASTAPI_URL}/gpx/${encodeURIComponent(id)}/download`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'GPX file not found' }, { status: res.status });
    }

    const xmlContent = await res.text();
    const disposition = res.headers.get('content-disposition') || `attachment; filename="route-${id}.gpx"`;

    return new Response(xmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/gpx+xml; charset=utf-8',
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Failed to download GPX file' }, { status: 500 });
  }
}
