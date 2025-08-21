import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likedPostsCommandApi } from '../apis/liked-posts/command/liked-posts.command.api';
import { QUERY_KEYS } from '../constants/query-keys.constant';

export const useToggleLike = (userId, postId) => {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => likedPostsCommandApi.likePost(userId, postId),
    onError: (error) => {
      // If the API call fails, invalidate queries to revert optimistic updates
      queryClient.invalidateQueries([QUERY_KEYS.LIKE_STATUS, userId, postId]);
      queryClient.invalidateQueries([QUERY_KEYS.LIKE_COUNT, postId]);
      console.error('Like post failed:', error);
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: () => likedPostsCommandApi.unlikePost(userId, postId),
    onError: (error) => {
      // If the API call fails, invalidate queries to revert optimistic updates
      queryClient.invalidateQueries([QUERY_KEYS.LIKE_STATUS, userId, postId]);
      queryClient.invalidateQueries([QUERY_KEYS.LIKE_COUNT, postId]);
      console.error('Unlike post failed:', error);
    },
  });

  return {
    like: likeMutation.mutate,
    unlike: unlikeMutation.mutate,
    isLoading: likeMutation.isLoading || unlikeMutation.isLoading,
  };
};
