import httpClient from '@/src/utils/http-client.util';

const url = '/api/follow';

export const followCommandApi = {
  toggleFollow: async (followingId, method) => {
    const res = await httpClient(`${url}/${followingId}`, { method });
    return res.data;
  },
};
