import httpClient from '@/src/utils/http-client.util';

const url = '/posts';

export const postsCommandApi = {
  savedPost: async (post) => {
    const res = await httpClient.post(url, post);
    return res.data;
  },
  updatePost: async (post) => {
    const res = await httpClient.put(url, post);
    return res.data;
  },
  deletePost: async (postId) => {
    const res = await httpClient.delete(`${url}/${postId}`);
    return res.data;
  },
  archivePost: async (postId) => {
    const res = await httpClient.put(`${url}/${postId}/archive`);
    return res.data;
  },
};
