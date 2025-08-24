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
      if (process.env.NODE_ENV === 'development') {
        console.log('Follow mutation called:', { followingId, newStatus });
      }
      
      const method = newStatus ? 'post' : 'delete';
      const response = await followCommandApi.toggleFollow(followingId, method);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Follow API response:', response);
      }
      
      // Check if response contains error message
      if (response && typeof response === 'string' && (response.includes('error') || response.includes('Error'))) {
        throw new Error(response);
      }
      
      return response;
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.IS_FOLLOWING, userId, followingId] });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.COUNT_FOLLOWERS, followingId] });
      await queryClient.cancelQueries({ queryKey: [QUERY_KEYS.COUNT_FRIENDS, followingId] });

      const previousIsFollowing = queryClient.getQueryData([
        QUERY_KEYS.IS_FOLLOWING,
        userId,
        followingId,
      ]);
      const previousCount = queryClient.getQueryData([QUERY_KEYS.COUNT_FOLLOWERS, followingId]);
      const previousFriendsCount = queryClient.getQueryData([QUERY_KEYS.COUNT_FRIENDS, followingId]);

      const optimisticStatus = !previousIsFollowing;

      // Update optimistic UI
      queryClient.setQueryData([QUERY_KEYS.IS_FOLLOWING, userId, followingId], optimisticStatus);
      queryClient.setQueryData(
        [QUERY_KEYS.COUNT_FOLLOWERS, followingId],
        (old) => (old || 0) + (optimisticStatus ? 1 : -1)
      );
      
      // Note: Friend count update is complex and depends on mutual follow status
      // We'll let the server handle this and invalidate the query

      return { previousIsFollowing, previousCount, previousFriendsCount };
    },

    onError: (err, _, context) => {
      console.error('Follow toggle error:', err.message);
      
      // Revert optimistic updates
      if (context?.previousIsFollowing !== undefined) {
        queryClient.setQueryData(
          [QUERY_KEYS.IS_FOLLOWING, userId, followingId],
          context.previousIsFollowing
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.COUNT_FOLLOWERS, followingId], context.previousCount);
      }
      if (context?.previousFriendsCount !== undefined) {
        queryClient.setQueryData([QUERY_KEYS.COUNT_FRIENDS, followingId], context.previousFriendsCount);
      }
      
      // Show user-friendly error message
      if (err.message.includes('not authenticated')) {
        console.error('Authentication error - user not logged in');
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries([QUERY_KEYS.IS_FOLLOWING, userId, followingId]);
      queryClient.invalidateQueries([QUERY_KEYS.COUNT_FOLLOWERS, followingId]);
      queryClient.invalidateQueries([QUERY_KEYS.COUNT_FOLLOWING, followingId]);
      queryClient.invalidateQueries([QUERY_KEYS.COUNT_FRIENDS, followingId]);
      // Also invalidate friend count for the current user since friendship status might change
      if (userId) {
        queryClient.invalidateQueries([QUERY_KEYS.COUNT_FRIENDS, userId]);
      }
    },
  });

  const { data: followersCount = 0, isLoading: isLoadingFollowers } = useQuery({
    queryKey: [QUERY_KEYS.COUNT_FOLLOWERS, followingId],
    queryFn: () => followQueryApi.countFollowers(followingId),
    enabled: !!followingId,
  });

  const { data: followingCount = 0, isLoading: isLoadingFollowing } = useQuery({
    queryKey: [QUERY_KEYS.COUNT_FOLLOWING, followingId],
    queryFn: () => followQueryApi.countFollowing(followingId),
    enabled: !!followingId,
  });

  const { data: friendsCount = 0, isLoading: isLoadingFriends } = useQuery({
    queryKey: [QUERY_KEYS.COUNT_FRIENDS, followingId],
    queryFn: () => followQueryApi.countFriends(followingId),
    enabled: !!followingId,
  });

  return {
    isFollowing,
    toggleFollowMutation,
    toggleFollow: (newStatus) => {
      // Add validation
      if (!userId || !followingId) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Missing userId or followingId:', { userId, followingId });
        }
        return;
      }
      
      // If newStatus is provided, use it; otherwise toggle the current status
      const targetStatus = newStatus !== undefined ? newStatus : !Boolean(isFollowing);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Toggling follow:', { userId, followingId, currentStatus: isFollowing, newStatus: targetStatus });
      }
      
      toggleFollowMutation.mutate(targetStatus);
    },
    isToggleLoading: toggleFollowMutation.isPending,
    followersCount,
    followingCount,
    friendsCount,
    isLoadingFollowers,
    isLoadingFollowing,
    isLoadingFriends,
  };
};
