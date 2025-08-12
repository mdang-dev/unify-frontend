import httpClient from '@/src/utils/http-client.util';
import { getVietnamTimeISO } from '@/src/utils/timezone.util';

const url = '/messages';

export const chatQueryApi = {
  // ✅ NEW: Check message status with backend
  checkMessageStatus: async (messageId, clientTempId) => {
    try {
      const params = new URLSearchParams();
      if (messageId) params.append('messageId', messageId);
      if (clientTempId) params.append('clientTempId', clientTempId);
      
      const res = await httpClient.get(`${url}/status?${params.toString()}`);
      
      if (!res?.data) {
        return { status: 'unknown', exists: false };
      }
      
      return {
        messageId: res.data.messageId,
        status: res.data.status, // 'pending', 'sent', 'delivered', 'read', 'failed'
        timestamp: res.data.timestamp,
        exists: true,
        serverConfirmed: true
      };
    } catch (error) {
      console.warn('Failed to check message status:', error);
      return { status: 'unknown', exists: false, error: error.message };
    }
  },

  // ✅ NEW: Batch check multiple message statuses
  batchCheckMessageStatus: async (messageIds) => {
    try {
      const res = await httpClient.post(`${url}/batch-status`, {
        messageIds: messageIds
      });
      
      if (!res?.data || !Array.isArray(res.data)) {
        return {};
      }
      
      // Return as map for easy lookup
      return res.data.reduce((acc, status) => {
        acc[status.messageId || status.clientTempId] = {
          status: status.status,
          timestamp: status.timestamp,
          serverConfirmed: true
        };
        return acc;
      }, {});
    } catch (error) {
      console.warn('Failed to batch check message status:', error);
      return {};
    }
  },

  getChatList: async (userId) => {
    try {
      if (!userId) {
        return [];
      }

      try {
        const res = await httpClient.get(`${url}/chat-list/${userId}`);
        
        if (!res?.data || !Array.isArray(res.data)) {
          return [];
        }
        
        return res.data
          .map((chat) => {
          if (!chat || typeof chat !== 'object') {
            return null;
          }
          
          return {
            userId: chat.userId,
            fullname: chat.fullName || 'Unknown User',
            username: chat.username || 'unknown',
            avatar: chat.avatar,
            lastMessage: chat.lastMessage || '',
              lastUpdated: chat.lastMessageTime
                ? new Date(chat.lastMessageTime).toISOString()
                : getVietnamTimeISO(),
          };
          })
          .filter(Boolean);
      } catch (e) {
        // Axios uses CanceledError/ERR_CANCELED when aborted; normalize handling
        const isCanceled =
          e?.code === 'ERR_CANCELED' || e?.name === 'CanceledError' || e?.message === 'canceled';
        if (isCanceled) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Chat list request canceled');
          }
          return [];
        }
        throw e;
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
    
    // ✅ DEFAULT STATE: Ensure messages from DB have proper default state
    const messages = res?.data || [];
    return messages
      .map(msg => ({
        ...msg,
        // Set default state for messages from database (they're already sent)
        messageState: msg.messageState || 'sent',
        backendConfirmed: msg.backendConfirmed !== undefined ? msg.backendConfirmed : true,
        isOptimistic: msg.isOptimistic || false,
      }))
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },
};
