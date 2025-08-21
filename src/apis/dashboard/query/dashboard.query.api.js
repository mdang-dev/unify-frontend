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
};
