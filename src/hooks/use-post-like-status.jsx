import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { likedPostsCommandApi } from '../apis/liked-posts/command/liked-posts.command.api';

export const usePostLikeStatus = (userId, postId) => {
  const queryClient = useQueryClient();

  // Fetch like status
  const { data: isLiked = false, isLoading: isLoadingLikeStatus } = useQuery({
    queryKey: [QUERY_KEYS.LIKE_STATUS, userId, postId],
    queryFn: () => likedPostsCommandApi.getLikeStatus(userId, postId),
    enabled: !!userId && !!postId, // Only fetch if userId and postId are provided
  });

  // Fetch like count
  const { data: likeCount = 0, isLoading: isLoadingLikeCount } = useQuery({
    queryKey: [QUERY_KEYS.LIKE_COUNT, postId],
    queryFn: () => likedPostsCommandApi.getLikeCount(postId),
    enabled: !!postId, // Only fetch if postId is provided
  });

  // Optimistic updates for like status
  const setIsLiked = (newIsLiked) => {
    queryClient.setQueryData([QUERY_KEYS.LIKE_STATUS, userId, postId], newIsLiked);
  };

  // Optimistic updates for like count
  const setLikeCount = (newLikeCount) => {
    queryClient.setQueryData([QUERY_KEYS.LIKE_COUNT, postId], newLikeCount);
  };

  return {
    isLiked,
    setIsLiked,
    likeCount,
    setLikeCount,
    loading: isLoadingLikeStatus || isLoadingLikeCount,
  };
};
