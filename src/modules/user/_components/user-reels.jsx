import React, { useState, useEffect } from 'react';
import { PostDetailModal } from '@/src/components/base';
import { Spinner } from '@heroui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userQueryApi } from '@/src/apis/user/query/user.query.api';
import { postsCommandApi } from '@/src/apis/posts/command/posts.command.api';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';

const UserReels = ({ username }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const queryClient = useQueryClient();

  const { data: userInfo } = useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE_BY_USERNAME, username],
    queryFn: () => userQueryApi.getInfoByUsername(username),
    enabled: !!username,
  });

  const {
    data: postUsers = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.POSTS_BY_USER, userInfo?.id],
    queryFn: () => postsQueryApi.getPostsByUser(userInfo?.id),
    enabled: !!userInfo?.id,
  });

  const { mutate: mutateDeletePost } = useMutation({
    mutationFn: ({ postId }) => postsCommandApi.deletePost(postId),
  });

  const handleDeletePost = async (postId) => {
    mutateDeletePost(postId, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS_BY_USER, userInfo?.id] });
        setSelectedPost(null);
      },
    });
  };

  useEffect(() => {
    setSelectedMedia(selectedPost?.media?.[0] || null);
  }, [selectedPost]);

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setSelectedMedia(post.media?.[0] || null);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {loading ? (
        // <p className="text-center">Loading...</p>
        <div className="flex h-screen items-center justify-center">
          <Spinner color="primary" label="Loading posts..." labelColor="primary" />
        </div>
      ) : postUsers.some((post) => post.media.some((media) => media.mediaType === 'VIDEO')) ? (
        <div className="grid grid-cols-3 gap-1">
          {postUsers
            .filter((post) => post.media.some((media) => media.mediaType === 'VIDEO'))
            .map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square cursor-pointer"
                onClick={() => handlePostClick(post)}
              >
                <div className="pointer-events-none absolute left-0 right-0 top-0 bg-black/50 p-1 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <p className="text-sm">
                    {post.postedAt
                      ? (() => {
                          const date = new Date(post.postedAt);
                          const mm = String(date.getMonth() + 1).padStart(2, '0');
                          const dd = String(date.getDate()).padStart(2, '0');
                          const yyyy = date.getFullYear();
                          return `${mm}-${dd}-${yyyy}`;
                        })()
                      : ''}
                  </p>
                </div>
                <div className="h-full w-full overflow-hidden">
                  <video
                    src={post.media.find((media) => media.mediaType === 'VIDEO').url}
                    className="h-full w-full object-cover"
                    muted
                  />
                </div>
              </div>
            ))}
        </div>
      ) : (
          <div className="flex h-[400px] flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <i className="fa-regular fa-image mb-4 text-4xl"></i>
            <p className="mb-2 text-lg font-medium">No posts yet</p>
            <p className="text-sm">
              When you share photos and videos, they&apos;ll appear on your profile.
            </p>           
          <button onClick={refetch} className="text-blue-500">
            Try again
          </button>
          </div>
      )}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDelete={handleDeletePost}
        />
      )}
    </div>
  );
};

export default UserReels;
