import PostsUpdate from '@/src/modules/posts/posts-update';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function fetchJson(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export default async function Page({ params }) {
  const { postId } = await params;
  const token = (await cookies()).get('token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // If no token, rely on middleware, but double-guard here
  if (!token) redirect('/');

  try {
    const [post, me] = await Promise.all([
      fetchJson(`${baseUrl}/posts/post_detail/${postId}`, token),
      fetchJson(`${baseUrl}/users/my-info`, token),
    ]);

    const postAuthorId = post?.user?.id ?? post?.userId;
    if (!postAuthorId || !me?.id || postAuthorId !== me.id) {
      redirect('/');
    }
  } catch (_) {
    redirect('/');
  }

  return <PostsUpdate />;
}
