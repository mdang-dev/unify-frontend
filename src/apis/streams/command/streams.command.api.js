import httpClient from '@/src/utils/http-client.util';

const url = '/streams';

export const streamsCommandApi = {
  createViewerToken: async (hostIdentity, selfIdentity) => {
    const res = await httpClient.post(`${url}/create-viewer-token`, { hostIdentity, selfIdentity });
    return res.data;
  },

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
  
  createConnection: async (data) => {
    const res = await httpClient.post(`${url}/create-connection`, data);
    return res.data;
  },

  updateChatSettings: async (userId, chatSettings) => {
    const res = await httpClient.put(`${url}/user/${userId}/chat-settings`, chatSettings);
    return res.data;
  },

  updateStreamDetails: async (userId, streamDetails) => {
    const res = await httpClient.put(`${url}/user/${userId}/details`, streamDetails);
    return res.data;
  },
};
