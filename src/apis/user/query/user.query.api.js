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
  manageUsers: async (params) => {
    const res = await httpClient(`${url}/manage`, {
      params: {
        birthDay: params.birthDay || undefined,
        email: params.email || undefined,
        status: params.status || undefined,
        username: params.username || undefined,
        firstName: params.firstName || undefined,
        lastName: params.lastName || undefined,
        page: params.page || 0,
        size: params.size || 10,
      },
    });
    return res.data;
  },
};
