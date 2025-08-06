import httpClient from '@/src/utils/http-client.util';

const url = '/api/follow';

export const followCommandApi = {
  toggleFollow: async (followingId, method) => {
    const res = await httpClient.request({
      url: `${url}/${followingId}`,
      method: method
    });
    return res.data;
  },
};
