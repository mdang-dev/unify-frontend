import httpClient from '@/src/utils/http-client.util';

const url = '/api/call';

export const callCommandApi = {
  createCall: async (callerId, calleeId, video) => {
    const res = await httpClient.post(url, { callerId, calleeId, video });
    return res.data;
  },
  leaveCall: async (code) => {
    const res = await httpClient.delete(`${url}/${code}`);
    return res.data;
  },
};
