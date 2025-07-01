import httpClient from '@/src/utils/http-client.util';

const url = '/streams';

export const streamsQueryApi = {
  getLiveStreams: async () => {
    const response = await httpClient(`${url}/live`);
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
};
