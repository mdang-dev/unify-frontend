import httpClient from '@/src/utils/http-client.util';

const url = '/reports';

export const adminReportsQueryApi = {
    /**
     * Admin endpoint to get distinct reported users with aggregated data
     * @param {Object} params - Query parameters
     * @param {number} params.status - Filter by report status (optional)
     * @param {string} params.reportedAtFrom - Filter by reportedAt start date (optional, ISO format)
     * @param {string} params.reportedAtTo - Filter by reportedAt end date (optional, ISO format)
     * @param {number} params.page - Page number (default 0)
     * @param {number} params.size - Page size (default 20)
     * @param {string} params.sort - Sort criteria (default: latestReportedAt,desc)
     * @returns {Promise<Page<ReportSummaryDto>>} Page of ReportSummaryDto for users
     */
    getReportedUsers: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();

            // Add parameters if they exist and are not empty
            if (params.status !== undefined && params.status !== null && params.status !== '') {
                queryParams.append('status', params.status);
            }
            if (params.reportedAtFrom && params.reportedAtFrom.trim() !== '') {
                queryParams.append('reportedAtFrom', params.reportedAtFrom);
            }
            if (params.reportedAtTo && params.reportedAtTo.trim() !== '') {
                queryParams.append('reportedAtTo', params.reportedAtTo);
            }

            // Always include pagination and sort
            queryParams.append('page', params.page || 0);
            queryParams.append('size', params.size || 20);
            queryParams.append('sort', params.sort || 'latestReportedAt,desc');

            const res = await httpClient(`${url}/admin/targets/users?${queryParams.toString()}`);
            return res.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching reported users:', error);
            }
            throw error;
        }
    },

    /**
     * Admin endpoint to get report details by reported user ID
     * @param {string} reportedId - The reported user ID
     * @returns {Promise<ReportDetailDto>} Report detail data
     */
    getReportDetailByTarget: async (reportedId) => {
        try {
            const res = await httpClient(`${url}/target/${reportedId}`);
            return res.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching report detail:', error);
            }
            throw error;
        }
    },
};
