import httpClient from '@/src/utils/http-client.util';

const url = '/savedPosts';

export const savedPostsCommandApi = {
  toggleSavedPosts: async (userId, postId) => {
    const res = await httpClient.post(`${url}/add/${userId}/${postId}`);
    return res.data;
  },
};
