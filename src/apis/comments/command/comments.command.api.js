import httpClient from '@/src/utils/http-client.util';

const url = '/comments';

export const commentsCommandApi = {
  createComment: async (data) => {
    const res = await httpClient.post(url, data);
    return res.data;
  },
};
