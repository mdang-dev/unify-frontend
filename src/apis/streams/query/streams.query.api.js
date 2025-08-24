import httpClient from '@/src/utils/http-client.util';

const url = '/streams';

export const streamsQueryApi = {
  getLiveStreams: async ({ viewerId, page = 0, size = 12 } = {}) => {
    if (!viewerId) {
      throw new Error('viewerId is required');
    }
    
    const response = await httpClient(`${url}/live?viewerId=${viewerId}&page=${page}&size=${size}`);
    return response.data;
  },

  getStream: async (roomId) => {
    const response = await httpClient(`${url}/${roomId}`);
    return response.data;
  },
  
  getConnection: async (userId) => {
    const res = await httpClient(`${url}/${userId}/connection`);
    return res.data;
  },
  
  getFollowedStreamsByUserId: async (userId) => {
    const res = await httpClient(`${url}/following?currentUserId=${userId}`);
    return res.data;
  },

  getChatSettings: async (userId) => {
    const res = await httpClient.get(`${url}/user/${userId}/chat-settings`);
    return res.data;
  },

  getUserLiveStatus: async (userId) => {
    const res = await httpClient.get(`${url}/user/${userId}/live-status`);
    return res.data;
  },

  getFollowedUsersWithLiveStatus: async ({ viewerId, page = 0, size = 10 } = {}) => {
    if (!viewerId) {
      throw new Error('viewerId is required');
    }
    
    const response = await httpClient(`${url}/followed-users?viewerId=${viewerId}&page=${page}&size=${size}`);
    return response.data;
  },

  getStreamDetails: async (userId) => {
    const res = await httpClient.get(`${url}/user/${userId}/get-details`);
    return res.data;
  },
};
