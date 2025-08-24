import httpClient from '@/src/utils/http-client.util';

const url = '/api/follow';

export const followQueryApi = {
  isFollowing: async (userId, followingId) => {
    const res = await httpClient.get(`${url}/isFollowing/${userId}/${followingId}`);
    return res.data;
  },
  countFollowers: async (userId) => {
    const res = await httpClient.get(`${url}/followers/${userId}`);
    return res.data;
  },
  countFollowing: async (userId) => {
    const res = await httpClient.get(`${url}/following/${userId}`);
    return res.data;
  },
    countFriends: async (userId) => {
    const res = await httpClient.get(`${url}/friends/${userId}`);
    return res.data;
  },
  // New endpoint to get followers with live status
  getFollowersWithLiveStatus: async (userId) => {
    const res = await httpClient.get(`${url}/followers/${userId}/with-live-status`);
    return res.data;
  },
};
