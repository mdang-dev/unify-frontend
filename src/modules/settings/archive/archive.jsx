'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { addToast } from '@heroui/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';
import { userQueryApi } from '@/src/apis/user/query/user.query.api';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { postsCommandApi } from '@/src/apis/posts/command/posts.command.api';
import PostCard from './_components/post-card';
import { PostDetailModal } from '@/src/components/base';
const Archive = () => {
  const [selectedPost, setSelectedPost] = useState(null);
  const { username } = useParams();
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
    queryKey: [QUERY_KEYS.ARCHIVED_POSTS_BY_USER, userInfo?.id],
    queryFn: () => postsQueryApi.getMyArchivedPosts(userInfo?.id),
    enabled: !!userInfo?.id,
  });

  const { mutate: deletePost } = useMutation({
    mutationFn: ({ postId }) => postsCommandApi.deletePost(postId),
  });

  const { mutate: archivePost } = useMutation({
    mutationFn: ({ postId }) => postsCommandApi.archivePost(postId),
  });

  const handleDeletePost = useCallback(async (postId) => {
    deletePost(
      { postId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ARCHIVED_POSTS_BY_USER, userInfo?.id],
          });
          addToast({
            title: 'Success',
            description: 'Post deleted successfully.',
            timeout: 3000,
            color: 'success',
          });
        },
        onError: () => {
          addToast({
            title: 'Error',
            description: 'Failed to delete post: ' + (error.message || 'Unknown error'),
            timeout: 3000,
            color: 'danger',
          });
        },
        onSettled: () => setSelectedPost(null),
      }
    );
  }, []);

  const handleArchivePost = useCallback((postId) => {
    archivePost(
      { postId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.ARCHIVED_POSTS_BY_USER, userInfo?.id],
          });
          addToast({
            title: 'Success',
            description: 'Successfully moved to archive.',
            timeout: 3000,
            color: 'success',
          });
        },
        onError: () => {
          addToast({
            title: 'Error',
            description: 'Failed to archive post: ' + (error.message || 'Unknown error'),
            timeout: 3000,
            color: 'danger',
          });
        },
        onSettled: () => setSelectedPost(null),
      }
    );
  }, []);

  const handlePostClick = useCallback((post) => setSelectedPost(post), []);
  const closeModal = useCallback(() => setSelectedPost(null), []);

  return (
    <>
      <div className="w-full">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <div className="flex h-screen items-center justify-center">
              <Spinner color="primary" label="Loading posts..." labelColor="primary" />
            </div>
          ) : postUsers.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {postUsers.map((post) => (
                <PostCard key={post.id} post={post} onClick={handlePostClick} />
              ))}
            </div>
          ) : (
            <div className="mt-4 text-center text-gray-500">
              <p>No posts available.</p>
              <button onClick={refetch} className="text-blue-500">
                Try again
              </button>
            </div>
          )}
          {selectedPost && (
            <PostDetailModal
              post={selectedPost}
              onClose={closeModal}
              onDelete={handleDeletePost}
              onArchive={handleArchivePost}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Archive;
