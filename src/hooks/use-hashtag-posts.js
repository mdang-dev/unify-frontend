import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

export const useHashtagPosts = (hashtag, pageSize = 20) => {
  const { ref, inView } = useInView({ 
    threshold: 0.1,
    rootMargin: '100px'
  });

  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    status,
    error,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.POSTS_BY_HASHTAG, hashtag],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await postsQueryApi.getPostsByHashtagWithPagination(hashtag, pageParam, pageSize);
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.hasNextPage) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    enabled: !!hashtag,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Get all posts from all pages
  const allPosts = data?.pages?.flatMap(page => page?.posts || []) || [];
  const totalPosts = allPosts.length;

  // Auto-fetch next page when user scrolls to bottom
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }

  return {
    // Data
    data,
    posts: allPosts,
    totalPosts,
    hasPosts: totalPosts > 0,
    
    // Loading states
    status,
    isInitialLoading: status === 'pending',
    isFetchingNextPage,
    isRefetching,
    
    // Error handling
    error,
    hasError: status === 'error',
    
    // Pagination
    hasNextPage,
    canLoadMore: hasNextPage && !isFetchingNextPage,
    
    // Actions
    fetchNextPage,
    refetch,
    
    // Intersection observer
    ref,
    inView,
  };
};
