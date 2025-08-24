import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { followQueryApi } from '../apis/follow/query/follow.query.api';

export const useFriendCount = (userId) => {
  const { data: friendsCount = 0, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.COUNT_FRIENDS, userId],
    queryFn: () => followQueryApi.countFriends(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    friendsCount,
    isLoading,
    error,
  };
};
