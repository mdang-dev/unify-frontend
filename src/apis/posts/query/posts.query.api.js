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
      const res = await httpClient(`${url}/filter`, {
        params: {
          captions: filters.captions || undefined,
          status: filters.status || undefined,
          audience: filters.audience || undefined,
          postedAt: filters.postedAt || undefined,
          isCommentVisible: filters.isCommentVisible || undefined,
          isLikeVisible: filters.isLikeVisible || undefined,
          commentCount: filters.commentCount || undefined,
          commentCountOperator: filters.commentCountOperator || '=',
          page: filters.page || 0,
          size: filters.size || 10,
        },
      });

      const data = res?.data || {};
      const content = Array.isArray(data.content) ? data.content : [];
      const currentPage = typeof data.number === 'number' ? data.number : (filters.page || 0);
      const totalPages = typeof data.totalPages === 'number' ? data.totalPages : 0;
      const last = typeof data.last === 'boolean' ? data.last : (currentPage >= (totalPages - 1));

      return {
        posts: content,
        hasNextPage: !last,
        currentPage,
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
        totalPages: 0,
      };
    }
  },
};
