import httpClient from '@/src/utils/http-client.util';

const url = '/liked-posts';

export const likedPostsCommandApi = {
  getLikeStatus: async (userId, postId) => {
    const res = await httpClient(`${url}/is-liked/${userId}/${postId}`);
    return res.data;
  },

  getLikeCount: async (postId) => {
    const res = await httpClient(`${url}/countLiked/${postId}`);
    return res.data;
  },

  likePost: async (userId, postId) => {
    const res = await httpClient.post(url, { userId, postId });
    return res.data;
  },

  unlikePost: async (userId, postId) => {
    const res = await httpClient.delete(`${url}/${userId}/${postId}`);
    return res.data;
  },
};
