import httpClient from '@/src/utils/http-client.util';

const url = '/reports';
export const reportsQueryApi = {
  getReportByStatus: async (status) => {
    const res = await httpClient(`${url}/reportUser/status?statuses=${status}&entityType=USER`);
    return res.data;
  },
  getReportsByPost: async (postId) => {
    const res = await httpClient(`${url}/${postId}`);
    return res.data;
  },
  fetchFilteredReportedPosts: async (key) => {
    const res = await httpClient(`${url}/filter/${key}`);
    return res.data;
  },
  fetchReportsOnMyPosts: async (username) => {
    const res = await httpClient(`/reportUser/reported-my-posts?username=${username}`);
    return res.data;
  },
  fetchMyReportedEntities: async (username) => {
    const res = await httpClient(`/reportUser/user-reports?username=${username}`);
    return res.data;
  },
};
