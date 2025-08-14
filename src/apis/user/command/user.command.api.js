import httpClient from '@/src/utils/http-client.util';

export const userCommandApi = {
  changePassword: async (currentPassword, newPassword) => {
    const res = await httpClient.post('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
  updateUser: async (data) => {
    const res = await httpClient.put(`/users`, data);
    return res.data;
  },
};
