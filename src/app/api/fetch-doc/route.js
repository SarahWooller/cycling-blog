import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const docUrl = searchParams.get('url');

  if (!docUrl) {
    return NextResponse.json({ error: 'Google Doc URL is required' }, { status: 400 });
  }

  // Extract Doc ID from link
  // e.g. https://docs.google.com/document/d/1e30mZiEnBOU7oP8rpqcnZXahBderJpMOMv60sJdxTRs/edit...
  const match = docUrl.match(/\/document\/d\/([a-zA-Z0-9_\-]+)/);
  if (!match) {
    return NextResponse.json({ error: 'Invalid Google Doc URL format' }, { status: 400 });
  }

  const docId = match[1];
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

  try {
    const res = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Could not export Google Doc: HTTP ${res.status}. Please check sharing permissions.` }, { status: 502 });
    }

    let text = await res.text();
    // Strip BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    // Split into clean paragraphs
    const rawParagraphs = text.split(/\r?\n\r?\n/);
    const paragraphs = rawParagraphs
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return NextResponse.json({
      docId,
      fullText: text.trim(),
      paragraphs,
    });
  } catch (error) {
    console.error('Error fetching Google Doc:', error);
    return NextResponse.json({ error: 'Failed to fetch Google Doc text' }, { status: 500 });
  }
}
