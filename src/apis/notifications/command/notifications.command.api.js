import httpClient from '@/src/utils/http-client.util';

const url = '/api/notifications';

export const notificationsCommandApi = {
  fetch: async (userId, page = 1) => {
    const res = await httpClient.get(`${url}/${userId}`, { params: { page } });
    return res.data;
  },

  markAsRead: async (notificationId, userId) => {
    const res = await httpClient.post(`${url}/mark-as-read`, { notificationId, userId });
    return res.data;
  },

  markAllAsRead: async (userId) => {
    const res = await httpClient.patch(`${url}/mark-all-as-read`, { userId });
    return res.data;
  },
};
