import httpClient from '@/src/utils/http-client.util';

const url = '/users';

export const userQueryApi = {
  getInfoByUsername: async (username) => {
    const res = await httpClient(`${url}/username/${username}`);
    return res.data;
  },
  getAllUsers: async () => {
    const res = await httpClient(url);
    return res.data;
  },
  getUserById: async (userId) => {
    const res = await httpClient(`${url}/${userId}`);
    return res.data;
  },
  searchUsers: async (query) => {
    if (!query?.trim()) {
      return [];
    }
    const res = await httpClient(`${url}/search`, {
      params: { query: query.trim() },
    });
    return res.data;
  },
};
