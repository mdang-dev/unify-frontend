import httpClient from '@/src/utils/http-client.util';
import { getVietnamTimeISO } from '@/src/utils/timezone.util';

const url = '/messages';

export const chatQueryApi = {
  getChatList: async (userId) => {
    try {
      if (!userId) {
        return [];
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const res = await httpClient.get(`${url}/chat-list/${userId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!res?.data || !Array.isArray(res.data)) {
          return [];
        }
        
        return res.data.map((chat) => {
          if (!chat || typeof chat !== 'object') {
            return null;
          }
          
          return {
            userId: chat.userId,
            fullname: chat.fullName || 'Unknown User',
            username: chat.username || 'unknown',
            avatar: chat.avatar,
            lastMessage: chat.lastMessage || '',
            lastUpdated: chat.lastMessageTime ? new Date(chat.lastMessageTime).toISOString() : getVietnamTimeISO(),
          };
        }).filter(Boolean);
      } catch (timeoutError) {
        clearTimeout(timeoutId);
        if (timeoutError.name === 'AbortError') {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Chat list request timed out');
          }
          return [];
        }
        throw timeoutError;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching chat list:', error.message);
      }
      return [];
    }
  },
  getMessages: async (userId, partnerId) => {
    const res = await httpClient.get(`${url}/${userId}/${partnerId}`);
    return res?.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },
};
