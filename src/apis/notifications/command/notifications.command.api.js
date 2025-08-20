import httpClient from '@/src/utils/http-client.util';

const url = '/api/notifications';

export const notificationsCommandApi = {
  // ✅ UPDATED: Fetch notifications with pagination
  fetch: async (userId, page = 0, size = 20) => {
    const res = await httpClient.get(`${url}/${userId}`, { 
      params: { page, size } 
    });
    return res.data;
  },

  // ✅ NEW: Get unread count
  getUnreadCount: async (userId) => {
    const res = await httpClient.get(`${url}/${userId}/unread-count`);
    return res.data.unreadCount;
  },

  markAsRead: async (notificationId, userId) => {
    const res = await httpClient.post(`${url}/mark-as-read`, { notificationId, userId });
    return res.data;
  },

  markAllAsRead: async (userId) => {
    const res = await httpClient.patch(`${url}/mark-all-as-read`, { userId });
    return res.data;
  },

  deleteNotification: async (notificationId) => {
    const res = await httpClient.delete(`${url}/${notificationId}`);
    return res.data;
  },
};
