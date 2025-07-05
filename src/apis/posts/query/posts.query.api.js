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
      console.error('Error fetching posts:', error);
      throw error;
    }
  },
  getPostsByHashtag: async (hashtag) => {
    const res = await httpClient(`${url}/hashtag/${hashtag}`);
    return res.data;
  },
  getRecommendedPosts: async () => {
    const res = await httpClient(`${url}/explorer`);
    console.log(res);
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
};
