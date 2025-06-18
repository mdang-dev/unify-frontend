import httpClient from '@/src/utils/http-client.util';

const url = '/api/follow';

export const followQueryApi = {
  isFollowing: async (userId, followingId) => {
    const res = await httpClient(`${url}/isFollowing/${userId}/${followingId}`);
    return res.data;
  },
  countFollowers: async (userId) => {
    const res = await httpClient(`${url}/followers/${userId}`);
    return res.data;
  },
  countFollowing: async (userId) => {
    const res = await httpClient(`${url}/following/${userId}`);
    return res.data;
  },
};
