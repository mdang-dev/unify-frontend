import httpClient from '@/src/utils/http-client.util';

const url = '/call';

export const callQueryApi = {
  getToken: async (code) => {
    const res = await httpClient(`${url}/token/${code}`);
    return res.data;
  },
};
