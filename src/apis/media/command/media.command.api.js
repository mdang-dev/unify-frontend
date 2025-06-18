import httpClient from '@/src/utils/http-client.util';

const url = '/media';

export const mediaCommandApi = {
  savedMedia: async (media) => {
    const res = await httpClient.post(url, media);
    return res.data;
  },
};
