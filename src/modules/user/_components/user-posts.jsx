'use client';
import React, { useState, useCallback } from 'react';
import { PostDetailModal } from '@/src/components/base';
import { addToast } from '@heroui/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userQueryApi } from '@/src/apis/user/query/user.query.api';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { postsCommandApi } from '@/src/apis/posts/command/posts.command.api';

const PostSkeleton = () => (
  <div className="relative aspect-square animate-pulse">
    <div className="h-full w-full bg-gray-200 dark:bg-neutral-700" />
  </div>
);

const UserPosts = ({ username }) => {
  const [selectedPost, setSelectedPost] = useState(null);
  const queryClient = useQueryClient();

  const { data: userInfo } = useQuery({
    queryKey: [QUERY_KEYS.USER_PROFILE_BY_USERNAME, username],
    queryFn: () => userQueryApi.getInfoByUsername(username),
    enabled: !!username,
  });

  const { data: postUsers = [], isLoading: loading } = useQuery({
    queryKey: [QUERY_KEYS.POSTS_BY_USER, userInfo?.id],
    queryFn: () => postsQueryApi.getPostsByUser(userInfo?.id),
    enabled: !!userInfo?.id,
  });

  const { mutate: mutateDeletePost } = useMutation({
    mutationFn: ({ postId }) => postsCommandApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS_BY_USER, userInfo?.id] });
      addToast({
        title: 'Success',
        description: 'Post deleted successfully.',
        timeout: 3000,

        color: 'success',
      });
      closeModal();
    },
    onError: (error) => {
      addToast({
        title: 'Error',
        description: 'Failed to delete post: ' + (error.message || 'Unknown error'),
        timeout: 3000,

        color: 'danger',
      });
    },
  });

  const { mutate: mutateArchivePost } = useMutation({
    mutationFn: ({ postId }) => postsCommandApi.archivePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.POSTS_BY_USER, userInfo?.id] });
      addToast({
        title: 'Success',
        description: 'Successfully moved to archive.',
        timeout: 3000,
        color: 'success',
      });
      closeModal();
    },
    onError: (error) => {
      addToast({
        title: 'Error',
        description: 'Failed to archive post: ' + (error.message || 'Unknown error'),
        timeout: 3000,
        color: 'danger',
      });
    },
  });

  const handleDeletePost = useCallback(
    (postId) => {
      mutateDeletePost({ postId });
    },
    [mutateDeletePost]
  );

  const handleArchivePost = useCallback(
    (postId) => {
      mutateArchivePost({ postId });
    },
    [mutateArchivePost]
  );

  const handlePostClick = useCallback((post) => {
    setSelectedPost(post);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedPost(null);
  }, []);

  return (
    <>
    
      <div className="mx-auto max-w-3xl">
        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {[...Array(9)].map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        ) : postUsers.length > 0 ? (
          <div className="grid grid-cols-3 gap-1">
            {postUsers.map((post) => (
              <div
                key={post.id}
                className="group relative aspect-square cursor-pointer"
                onClick={() => handlePostClick(post)}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="text-center text-white">
                    <p className="mb-2 text-sm">
                      {post.postedAt ? new Date(post.postedAt).toLocaleDateString() : ''}
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <i className="fa-regular fa-heart"></i>
                        <span>{post.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <i className="fa-regular fa-comment"></i>
                        <span>{post.comments?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {post.media.length === 0 ? (
                  <div className="flex h-full w-full items-center justify-center bg-black">
                    <p className="text-sm text-white">View article</p>
                  </div>
                ) : (
                  <div className="h-full w-full overflow-hidden">
                    {post.media[0]?.mediaType === 'VIDEO' ? (
                      <video
                        src={post.media[0]?.url}
                        className="h-full w-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={post.media[0]?.url}
                        className="h-full w-full object-cover"
                        alt="Post media"
                      />
                    )}
                  </div>
                )}
                {post.media.length > 1 && (
                  <div className="absolute right-2 top-2 rounded-full bg-black/50 px-1.5 py-0.5 text-xs text-white">
                    <i className="fa-solid fa-layer-group mr-1"></i>
                    {post.media.length}
                  </div>
                )}
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
          </div>
        )}
      </div>

      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={closeModal}
          onDelete={handleDeletePost}
          onArchive={handleArchivePost}
        />
      )}
    </>
  );
};

export default UserPosts;
