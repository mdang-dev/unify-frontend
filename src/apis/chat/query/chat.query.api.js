import httpClient from '@/src/utils/http-client.util';

const url = '/messages';

export const chatQueryApi = {
  getChatList: async (userId) => {
    const res = await httpClient(`${url}/chat-list/${userId}`);
    return res?.data.map((chat) => ({
      userId: chat.userId,
      fullname: chat.fullName,
      username: chat.username,
      avatar: chat.avatar,
      lastMessage: chat.lastMessage,
      lastUpdated: chat.lastMessageTime,
    }));
  },
  getMessages: async (userId, partnerId) => {
    const res = await httpClient(`${url}/${userId}/${partnerId}`);
    return res?.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  },
};
