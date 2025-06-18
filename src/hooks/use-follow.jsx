import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { followQueryApi } from '../apis/follow/query/follow.query.api';
import { followCommandApi } from '../apis/follow/command/follow.command.api';

export const useFollow = (userId, followingId) => {
  const queryClient = useQueryClient();

  const { data: isFollowing } = useQuery({
    queryKey: [QUERY_KEYS.IS_FOLLOWING, userId, followingId],
    queryFn: () => followQueryApi.isFollowing(userId, followingId),
    enabled: !!userId && !!followingId,
  });

  const toggleFollowMutation = useMutation({
    mutationFn: async (newStatus) => {
      const method = newStatus ? 'post' : 'delete';
      await followCommandApi.toggleFollow(followingId, method);
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.IS_FOLLOWING, userId, followingId] });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.COUNT_FOLLOWERS, followingId] });

      const previousIsFollowing = queryClient.getQueryData([
        QUERY_KEYS.IS_FOLLOWING,
        userId,
        followingId,
      ]);
      const previousCount = queryClient.getQueryData([QUERY_KEYS.COUNT_FOLLOWERS, followingId]);

      const optimisticStatus = !previousIsFollowing;

      // Update optimistic UI
      queryClient.setQueryData([QUERY_KEYS.IS_FOLLOWING, userId, followingId], optimisticStatus);
      queryClient.setQueryData(
        [QUERY_KEYS.COUNT_FOLLOWERS, followingId],
        (old) => (old || 0) + (optimisticStatus ? 1 : -1)
      );

      return { previousIsFollowing, previousCount };
    },

    onError: (err, _, context) => {
      if (context?.previousIsFollowing !== undefined) {
        queryClient.setQueryData(
          [QUERY_KEYS.IS_FOLLOWING, userId, followingId],
          context.previousIsFollowing
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.COUNT_FOLLOWERS, followingId], context.previousCount);
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.IS_FOLLOWING, userId, followingId]);
      queryClient.invalidateQueries([QUERY_KEYS.COUNT_FOLLOWERS, followingId]);
      queryClient.invalidateQueries([QUERY_KEYS.COUNT_FOLLOWING, followingId]);
    },
  });

  const { data: followersCount = 0, isLoading: isLoadingFollowers } = useQuery({
    queryKey: [QUERY_KEYS.COUNT_FOLLOWERS, followingId],
    queryFn: () => followQueryApi.countFollowers(followingId),
    enabled: !!followingId,
  });

  const { data: followingCount = 0, isLoading: isLoaddingFollowing } = useQuery({
    queryKey: [QUERY_KEYS.COUNT_FOLLOWING, followingId],
    queryFn: () => followQueryApi.countFollowing(followingId),
    enabled: !!followingId,
  });

  return {
    isFollowing,
    toggleFollow: () => toggleFollowMutation.mutate(!isFollowing),
    isToggleLoading: toggleFollowMutation.isPending,
    followersCount,
    followingCount,
    isLoaddingFollowing,
    isLoadingFollowers,
  };
};
