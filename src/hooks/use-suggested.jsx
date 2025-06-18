import { useQuery } from '@tanstack/react-query';
import { userSuggestionQueryApi } from '../apis/suggested-users/query/suggested-users.query.api';
import { useEffect } from 'react';
import { QUERY_KEYS } from '../constants/query-keys.constant';
import { useUserStore } from '../stores/user.store';
import { useAuthStore } from '../stores/auth.store';

export const useSuggestedUsers = () => {
  const { isDataLoaded, setIsDataLoaded } = useUserStore();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const suggestionsQuery = useQuery({
    queryKey: [QUERY_KEYS.SUGGESTIONS, userId],
    queryFn: () => userSuggestionQueryApi.suggestions(userId),
    enabled: !!userId,
  });

  const followersQuery = useQuery({
    queryKey: [QUERY_KEYS.FOLLOWERS, userId],
    queryFn: () => userSuggestionQueryApi.follower(userId),
    enabled: !!userId,
  });

  const friendsQuery = useQuery({
    queryKey: [QUERY_KEYS.FRIEND, userId],
    queryFn: () => userSuggestionQueryApi.friend(userId),
    enabled: !!userId,
  });

  const followingQuery = useQuery({
    queryKey: [QUERY_KEYS.FOLLOWING, userId],
    queryFn: () => userSuggestionQueryApi.following(userId),
    enabled: !!userId,
  });

  const loading =
    suggestionsQuery.isLoading ||
    followersQuery.isLoading ||
    friendsQuery.isLoading ||
    followingQuery.isLoading;

  const error =
    suggestionsQuery.error || followersQuery.error || friendsQuery.error || followingQuery.error;

  useEffect(() => {
    const allLoaded =
      suggestionsQuery.data && followersQuery.data && friendsQuery.data && followingQuery.data;

    if (!isDataLoaded && !loading && allLoaded) {
      setIsDataLoaded(true);
    }
  }, [
    isDataLoaded,
    loading,
    suggestionsQuery.data,
    followersQuery.data,
    friendsQuery.data,
    followingQuery.data,
    setIsDataLoaded,
  ]);

  return {
    suggestedUsers: suggestionsQuery.data || [],
    followerUsers: followersQuery.data || [],
    friendUsers: friendsQuery.data || [],
    followingUsers: followingQuery.data || [],
    loading,
    error,
    isDataLoaded,
    refreshData: () => {
      suggestionsQuery.refetch();
      followersQuery.refetch();
      friendsQuery.refetch();
      followingQuery.refetch();
    },
  };
};
