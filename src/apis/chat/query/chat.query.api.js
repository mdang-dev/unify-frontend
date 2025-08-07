import httpClient from '@/src/utils/http-client.util';
import { getVietnamTimeISO } from '@/src/utils/timezone.util';

const url = '/messages';

export const chatQueryApi = {
  getChatList: async (userId) => {
    try {
      const res = await httpClient.get(`${url}/chat-list/${userId}`);
      
      // Silent API response - only log errors
      
      if (!res?.data || !Array.isArray(res.data)) {
        // Silent invalid response - only log critical errors
        return [];
      }
      
      return res.data.map((chat) => {
        // Silent processing - only log errors
        return {
          userId: chat.userId,
          fullname: chat.fullName || 'Unknown User', // Backend returns fullName (camelCase)
          username: chat.username || 'unknown',
          avatar: chat.avatar,
          lastMessage: chat.lastMessage || '',
          lastUpdated: chat.lastMessageTime ? new Date(chat.lastMessageTime).toISOString() : getVietnamTimeISO(),
        };
      });
    } catch (error) {
      // Only log critical errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Critical error fetching chat list:', error);
      }
      return [];
    }
  },
  getMessages: async (userId, partnerId) => {
    const res = await httpClient.get(`${url}/${userId}/${partnerId}`);
    return res?.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },
};
