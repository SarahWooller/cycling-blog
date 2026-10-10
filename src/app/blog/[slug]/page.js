import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PostViewWrapper from '@/components/PostViewWrapper';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8079/api/v1';

async function getPost(slug) {
  try {
    const res = await fetch(`${FASTAPI_URL}/posts/${encodeURIComponent(slug)}`, {
      cache: 'no-store'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Failed fetching post ${slug} from backend API:`, err.message);
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: 'Post Not Found | VeloTales' };
  }

  return {
    title: `${post.title} | VeloTales Cycling Chronicle`,
    description: post.paragraphs?.[0]?.slice(0, 160) || 'Cycling adventure chronicle',
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <div className="blog-page-viewport-shell" style={{ backgroundColor: '#123f36' }}>
      <Navbar />
      <div className="blog-page-content-wrapper">
        <PostViewWrapper slug={slug} initialPost={post} />
      </div>

      <style>{`
        @media (min-width: 1025px) {
          .blog-page-viewport-shell {
            height: 100vh;
            max-height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .blog-page-content-wrapper {
            flex: 1;
            min-height: 0;
            height: 100%;
            overflow: hidden;
            position: relative;
            display: flex;
            flex-direction: column;
          }
        }
        @media (max-width: 1024px) {
          .blog-page-viewport-shell {
            min-height: 100vh;
          }
        }
      `}</style>
    </div>
  );
}
