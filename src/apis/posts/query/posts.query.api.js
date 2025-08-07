import httpClient from '@/src/utils/http-client.util';

const url = '/posts';

export const postsQueryApi = {
  getPosts: async (pageParam, pageSize) => {
    try {
      const res = await httpClient(`${url}/personalized`, {
        params: {
          page: pageParam,
          size: pageSize,
        },
      });

      return {
        posts: res?.data.posts ?? [],
        nextPage: res?.data.hasNextPage ? pageParam + 1 : null,
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching posts:', error);
      }
      throw error;
    }
  },
  getPostsByHashtag: async (hashtag) => {
    const res = await httpClient(`${url}/hashtag/${hashtag}`);
    return res.data;
  },
  getRecommendedPosts: async () => {
    // Fetch recommended posts for the explore page
    const res = await httpClient(`${url}/explorer`);
    if (process.env.NODE_ENV === 'development') {
      // Log response for debugging in development mode
      console.log(res);
    }
    return res.data;
  },
  getPostsById: async (postId) => {
    const res = await httpClient(`${url}/post_detail/${postId}`);
    return res.data;
  },
  getReelsFromPosts: async (pageParam, pageSize) => {
    const res = await httpClient(`${url}/reels?page=${pageParam}&size=${pageSize}`);
    return {
      posts: res?.data?.posts ?? [],
      nextPage: res?.data?.hasNextPage ? pageParam + 1 : null,
    };
  },
  getPostsByUser: async (userId) => {
    const res = await httpClient(`${url}/my?userId=${userId}&status=1&audience=PUBLIC`);
    return res.data;
  },
  getPostsPrivateByUser: async (userId) => {
    const res = await httpClient(`${url}/my?userId=${userId}&status=1&audience=PRIVATE`);
    return res.data;
  },
  getMyArchivedPosts: async (userId) => {
    const res = await httpClient(`${url}/myArchive?userId=${userId}&status=0`);
    return await res.data;
  },
  getPostDetails: async (postId) => {
    const res = await httpClient(`${url}/post_detail/${postId}`);
    return res.data;
  },
  getPostsWithFilters: async (filters) => {
    try {
      // TODO: Replace with actual filter endpoint when backend is ready
      // For now, use the personalized posts endpoint as a fallback
      if (process.env.NODE_ENV === 'development') {
        // Log fallback usage for debugging in development mode
        console.log('Using fallback endpoint - filters:', filters);
      }

      const res = await httpClient(`${url}/personalized`, {
        params: {
          page: filters.page || 0,
          size: filters.size || 10,
        },
      });

      // Transform the response to match the expected format for filtered posts
      return {
        posts: res?.data?.posts ?? [],
        hasNextPage: res?.data?.hasNextPage ?? false,
        currentPage: filters.page || 0,
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching posts with filters:', error);
      }

      // Return empty data structure to prevent UI errors
      return {
        posts: [],
        hasNextPage: false,
        currentPage: filters.page || 0,
      };
    }
  },
};
