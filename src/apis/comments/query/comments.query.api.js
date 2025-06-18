import httpClient from '@/src/utils/http-client.util';

const url = '/comments';

export const commentsQueryApi = {
  getCommentsByPostId: async (postId) => {
    const res = await httpClient(`${url}/${postId}`);
    return await res.data;
  },
};
