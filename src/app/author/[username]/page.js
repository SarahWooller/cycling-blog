import { notFound } from 'next/navigation';
import AuthorProfileView from '@/components/AuthorProfileView';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

async function getAuthorData(username) {
  try {
    const res = await fetch(`${FASTAPI_URL}/authors/${encodeURIComponent(username)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Error loading author ${username}:`, err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const author = await getAuthorData(username);
  if (!author) {
    return { title: 'Author Not Found | VeloTales' };
  }
  return {
    title: `${author.display_name} | VeloTales Author Profile`,
    description: author.bio_paragraphs?.[0] || `Read cycling stories and chronicles by ${author.display_name} on VeloTales.`,
  };
}

export default async function AuthorPage({ params }) {
  const { username } = await params;
  const author = await getAuthorData(username);

  if (!author) {
    notFound();
  }

  return <AuthorProfileView initialAuthor={author} />;
}
