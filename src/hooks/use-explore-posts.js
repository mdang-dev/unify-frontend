import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useDebounce } from './use-debounce-lodash';
import { postsQueryApi } from '@/src/apis/posts/query/posts.query.api';
import { QUERY_KEYS } from '@/src/constants/query-keys.constant';

// Helper function to normalize API response
const normalizeApiResponse = (response) => {
  if (!response) {
    return { posts: [], hasNextPage: false, currentPage: 0 };
  }

  // If response is already in correct format
  if (response.posts !== undefined && response.hasNextPage !== undefined && response.currentPage !== undefined) {
    return response;
  }

  // If response is an array (fallback)
  if (Array.isArray(response)) {
    return { posts: response, hasNextPage: false, currentPage: 0 };
  }

  // If response has different structure, try to extract posts
  if (response.data && Array.isArray(response.data)) {
    return { posts: response.data, hasNextPage: false, currentPage: 0 };
  }

  // If response has posts property but different structure
  if (response.posts && Array.isArray(response.posts)) {
    return { 
      posts: response.posts, 
      hasNextPage: response.hasNextPage || response.hasNext || false, 
      currentPage: response.currentPage || response.page || 0 
    };
  }

  return { posts: [], hasNextPage: false, currentPage: 0 };
};

export const useExplorePosts = (pageSize = 12) => {
  const { ref, inView } = useInView({ 
    threshold: 0.1,
    rootMargin: '100px' // Preload posts 100px before they're visible
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
    queryKey: [QUERY_KEYS.RECOMMENDED_POSTS],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await postsQueryApi.getRecommendedPosts(pageParam, pageSize);
      return normalizeApiResponse(response);
    },
    getNextPageParam: (lastPage) => {
      // Handle different response structures
      if (lastPage?.hasNextPage !== undefined) {
        return lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined;
      }
      
      // Fallback: if we have posts and they're less than pageSize, assume no more
      if (lastPage?.posts && Array.isArray(lastPage.posts)) {
        return lastPage.posts.length >= pageSize ? lastPage.currentPage + 1 : undefined;
      }
      
      return undefined;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  // Debounced loading state for better UX
  const showLoading = useDebounce(isFetchingNextPage, 150);

  // Get all posts from all pages with safety checks and fallbacks
  const allPosts = data?.pages?.flatMap(page => {
    if (!page) {
      return [];
    }
    
    // Handle different response structures
    let posts = null;
    let hasNext = false;
    let currentPage = 0;
    
    if (page.posts !== undefined) {
      posts = page.posts;
      hasNext = page.hasNextPage !== undefined ? page.hasNextPage : false;
      currentPage = page.currentPage !== undefined ? page.currentPage : 0;
    } else if (Array.isArray(page)) {
      // If page is directly an array of posts
      posts = page;
      hasNext = false;
      currentPage = 0;
    } else {
      return [];
    }
    
    // Validate posts array
    if (!posts || !Array.isArray(posts)) {
      return [];
    }
    
    // Filter valid posts
    const validPosts = posts.filter(post => post && post.id);
    return validPosts;
  }) || [];

  // Get total count of posts
  const totalPosts = allPosts.length;

  // Check if we have any posts
  const hasPosts = totalPosts > 0;

  // Check if we're in initial loading state
  const isInitialLoading = status === 'pending';

  // Check if we're in error state
  const hasError = status === 'error';

  // Check if we can load more
  const canLoadMore = hasNextPage && !isFetchingNextPage;

  // Auto-fetch next page when user scrolls to bottom
  const shouldFetchNext = inView && canLoadMore;

  return {
    // Data
    data,
    posts: allPosts,
    totalPosts,
    hasPosts,
    
    // Loading states
    status,
    isInitialLoading,
    isFetchingNextPage,
    showLoading,
    isRefetching,
    
    // Error handling
    error,
    hasError,
    
    // Pagination
    hasNextPage,
    canLoadMore,
    
    // Actions
    fetchNextPage,
    refetch,
    
    // Intersection observer
    ref,
    inView,
    shouldFetchNext,
  };
};
