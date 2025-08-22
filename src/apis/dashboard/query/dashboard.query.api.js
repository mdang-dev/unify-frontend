import httpClient from '@/src/utils/http-client.util';

const url = '/dashboard';

export const dashboardQueryApi = {
    getStats: async () => {
        try {
            const res = await httpClient(`${url}/stats`);
            return res.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching dashboard stats:', error);
            }
            throw error;
        }
    },
    getAnalytics: async (period) => {
        try {
            const res = await httpClient(`${url}/analytics?period=${period}`);
            return res.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching dashboard analytics:', error);
            }
            throw error;
        }
    },
    getReportedPosts: async () => {
        try {
            const res = await httpClient(`${url}/reports/posts`);
            return res.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching reported posts:', error);
            }
            throw error;
        }
    },
    getReportedUsers: async () => {
        try {
            const res = await httpClient(`${url}/reports/users`);
            return res.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching reported users:', error);
            }
            throw error;
        }
    },
    getReportedComments: async () => {
        try {
            const res = await httpClient(`${url}/reports/comments`);
            return res.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching reported comments:', error);
            }
            throw error;
        }
    },
    getReportsSummary: async () => {
        try {
            const res = await httpClient(`${url}/reports/summary`);
            return res.data;
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error fetching reports summary:', error);
            }
            throw error;
        }
    },
};
