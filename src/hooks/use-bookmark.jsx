import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useBookmarkStore } from '../stores/bookmark.store';
import { useAuthStore } from '../stores/auth.store';
import { savedPostsCommandApi } from '../apis/saved-posts/command/saved-posts.command.api';
import { savedPostsQueryApi } from '../apis/saved-posts/query/saved-posts.query.api';
import { QUERY_KEYS } from '../constants/query-keys.constant';

export const useBookmarks = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { savedPostsMap, setSavedStatus, resetSavedPosts } = useBookmarkStore();

  const username = user?.username;
  const userId = user?.id;

  const {
    data: bookmarks = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [QUERY_KEYS.SAVED_POSTS, username],
    queryFn: () => savedPostsQueryApi.getSavedPostsUsername(username),
    enabled: !!username,
    onSuccess: (data) => {
      const map = {};
      data.forEach((post) => {
        map[post.post.id] = true;
      });
      resetSavedPosts();
      Object.entries(map).forEach(([id, status]) => setSavedStatus(id, status));
    },
  });

  const { mutate: toggleBookmark, isPending: isToggling } = useMutation({
    mutationFn: (postId) => savedPostsCommandApi.toggleSavedPosts(userId, postId),
    onSuccess: (_, postId) => {
      const current = savedPostsMap[postId];
      setSavedStatus(postId, !current);
      queryClient.invalidateQueries([QUERY_KEYS.SAVED_POSTS, username]);
    },
  });

  return {
    bookmarks,
    isLoading,
    savedPostsMap,
    toggleBookmark,
    refetchBookmarks: refetch,
    isToggling,
  };
};
