import httpClient from '@/src/utils/http-client.util';

const url = '/reports';

export const reportsCommandApi = {
  createReport: async (endpoint, reportedId, reason, urls = []) => {
    const params = new URLSearchParams();
    params.append('reportedId', reportedId);
    params.append('reason', reason);
  
    // Ensure urls is an array and filter out null/undefined values
    const validUrls = Array.isArray(urls) ? urls.filter(url => url && typeof url === 'string' && url.trim() !== '') : [];
  
    // Append each URL with the key 'urls'
    validUrls.forEach(url => {
      params.append('urls', url);
    });
  
    const res = await httpClient.post(
      `${url}/${endpoint}`,
      params.toString(),
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
