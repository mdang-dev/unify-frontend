import httpClient from '@/src/utils/http-client.util';

export const authQueryApi = {
  getMyInfo: async () => {
    const res = await httpClient('/users/my-info');
    return res.data;
  },
};
