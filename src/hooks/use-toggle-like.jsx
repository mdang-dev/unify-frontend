import { useMutation, useQueryClient } from '@tanstack/react-query';
import { likedPostsCommandApi } from '../apis/liked-posts/command/liked-posts.command.api';
import { QUERY_KEYS } from '../constants/query-keys.constant';

export const useToggleLike = (userId, postId) => {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => likedPostsCommandApi.likePost(userId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.POST_LIKE_STATUS, userId, postId]);
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: () => likedPostsCommandApi.unlikePost(userId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.POST_LIKE_STATUS, userId, postId]);
    },
  });

  return {
    like: likeMutation.mutate,
    unlike: unlikeMutation.mutate,
    isLoading: likeMutation.isLoading || unlikeMutation.isLoading,
  };
};
