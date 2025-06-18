import httpClient from '@/src/utils/http-client.util';

export const userSuggestionQueryApi = {
  myInfo: async () => {
    const res = await httpClient('/users/my-info');
    return res.data;
  },

  suggestions: async (userId) => {
    const res = await httpClient(`/users/suggestions?currentUserId=${userId}`);
    return res.data;
  },

  follower: async (userId) => {
    const res = await httpClient(`/users/follower?currentUserId=${userId}`);
    return res.data;
  },

  friend: async (userId) => {
    const res = await httpClient(`/users/friend?currentUserId=${userId}`);
    return res.data;
  },

  following: async (userId) => {
    const res = await httpClient(`/users/following?currentUserId=${userId}`);
    return res.data;
  },
};
