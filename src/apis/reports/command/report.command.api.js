import httpClient from '@/src/utils/http-client.util';

const url = '/reports';

export const reportsCommandApi = {
  createReport: async (endpoint, reportedId, reason) => {
    const res = await httpClient.post(
      `${url}/${endpoint}`,
      new URLSearchParams({ reportedId, reason }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return res.data;
  },
  updateReport: async (reportId, status) => {
    const res = await httpClient.put(`${url}/${reportId}/status?status=${status}`);
    return res.data;
  },
  updateReportWithAdminReason: async (reportId, status, adminReason) => {
    const res = await httpClient.put(`${url}/${reportId}/status`, { status, adminReason });
    return res.data;
  },
  updateReportWithReason: async (reportId, status, reason) => {
    const res = await httpClient.put(`${url}/${reportId}/status?status=${status}`, { reason });
    return res.data;
  },
  createCommentReport: async (commentId, reason) => {
    const res = await httpClient.post(
      `${url}/comment?reportedId=${commentId}&reason=${encodeURIComponent(reason)}`
    );
    return res.data;
  },
};
