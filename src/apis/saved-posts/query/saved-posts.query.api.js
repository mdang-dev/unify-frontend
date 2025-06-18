import httpClient from '@/src/utils/http-client.util';

export const savedPostsQueryApi = {
  getSavedPostsUsername: async (username) => {
    const res = await httpClient(`/savedPosts/${username}`);
    return res.data;
  },
};
