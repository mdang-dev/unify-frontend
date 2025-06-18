import httpClient from '@/src/utils/http-client.util';

export const hashtagCommandApi = {
  insertHashtags: async (hashtags) => {
    const res = await httpClient.post(`/hashtags/saveAll`, hashtags);
    return res.data;
  },
  insertHashtagDetails: async (hashtags) => {
    const res = await httpClient.post(`/hashtag-details/saveAll`, hashtags);
    return res.data;
  },
};
