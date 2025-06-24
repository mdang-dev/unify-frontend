import httpClient from '@/src/utils/http-client.util';

const url = '/streams';

export const streamsCommandApi = {
  createStream: async (streamData) => {
    const res = await httpClient.post(`${url}/create`, streamData);
    return res.data;
  },

  startStream: async (roomId) => {
    const res = await httpClient.post(`${url}/${roomId}/start`);
    return res.data;
  },

  endStream: async (roomId) => {
    const res = await api.post(`${url}/${roomId}/end`);
    return res.data;
  },

  joinStream: async (roomId, userData) => {
    const res = await httpClient.post(`${url}/${roomId}/join`, userData);
    return res.data;
  },

  getBroadcastToken: async (roomId, userData) => {
    const res = await httpClient.post(`${url}/${roomId}/broadcast`, userData);
    return res.data;
  },
  generateConnection: async (userId) => {
    const res = await httpClient.post(`${url}/generate-connection`, { userId });
    return res.data;
  },
};
