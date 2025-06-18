'use client';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';

const UserPostList = ({ userId, onPostClick }) => {
  const { data: posts = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.POSTS_PRIVATE_BY_USER, userId],
    queryFn: () => postsQueryApi.getPostsByUser(userId),
    enabled: !!userId,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold dark:text-zinc-300">Posts</h3>
      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading posts...</p>
      ) : posts.length > 0 ? (
        <div className="no-scrollbar grid max-h-[60vh] grid-cols-2 gap-2 overflow-y-auto">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative cursor-pointer"
              onClick={() => onPostClick(post)}
            >
              {post.media.length === 0 ? (
                <div className="flex h-32 w-full items-center justify-center bg-black">
                  <p className="text-sm text-white">No media</p>
                </div>
              ) : (
                <div className="h-32 w-full overflow-hidden">
                  {post.media[0].mediaType === 'VIDEO' ? (
                    <video src={post.media[0].url} className="h-full w-full object-cover" />
                  ) : (
                    <img
                      src={post.media[0].url}
                      alt="Post Media"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">No posts available.</p>
      )}
    </div>
  );
};

export default UserPostList;
