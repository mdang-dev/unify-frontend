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
  getRecommendedPosts: async (pageParam = 0, pageSize = 12) => {
    try {
      // Fetch recommended posts for the explore page with pagination
      const res = await httpClient(`${url}/explorer`, {
        params: {
          page: pageParam,
          size: pageSize,
        },
      });
      return res.data;
    } catch (error) {
      console.error('Error fetching recommended posts:', error);
      throw error;
    }
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
      const res = await httpClient(`${url}/filter`, {
        params: {
          captions: filters.captions || undefined,
          status: filters.status || undefined,
          audience: filters.audience || undefined,
          isCommentVisible: filters.isCommentVisible || undefined,
          isLikeVisible: filters.isLikeVisible || undefined,
          hashtag: filters.hashtag || undefined, // Changed from hashtags to hashtag
          commentCount: filters.commentCount || undefined,
          commentCountOperator: filters.commentCountOperator || '=',
          page: filters.page || 0,
          pageSize: filters.pageSize || 20, // Changed from size to pageSize
        },
      });

      const data = res?.data || {};

      // Handle new PostTableResponse structure
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const currentPage = typeof data.page === 'number' ? data.page : (filters.page || 0);
      const pageSize = typeof data.pageSize === 'number' ? data.pageSize : (filters.pageSize || 20);
      const total = typeof data.total === 'number' ? data.total : 0;

      // Calculate if there's a next page
      const totalPages = Math.ceil(total / pageSize);
      const hasNextPage = currentPage < totalPages;

      return {
        posts: rows,
        hasNextPage,
        currentPage,
        pageSize,
        total,
        totalPages,
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
        pageSize: filters.pageSize || 20,
        total: 0,
        totalPages: 0,
      };
    }
  },
};
