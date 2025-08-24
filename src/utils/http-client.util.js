import axios from 'axios';
import { deleteCookie, getCookie } from './cookies.util';
import { COOKIE_KEYS } from '../constants/cookie-keys.constant';

const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 30000, // Increased from 10000 to 30000 (30 seconds)
});

// Retry configuration for failed requests
const retryConfig = {
  retries: 2,
  retryDelay: 1000,
  retryCondition: (error) => {
    return (
      error.code === 'ECONNABORTED' || // Timeout
      error.message.includes('timeout') ||
      (error.response && error.response.status >= 500) // Server errors
    );
  }
};

// Retry interceptor
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error;

    // Initialize retry count if not exists
    config.retryCount = config.retryCount || 0;

    if (retryConfig.retryCondition(error) && config.retryCount < retryConfig.retries) {
      config.retryCount += 1;

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * config.retryCount));

      // Retry the request
      return httpClient(config);
    }

    return Promise.reject(error);
  }
);

httpClient.interceptors.request.use(
  (config) => {
    const token = getCookie(COOKIE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      deleteCookie(COOKIE_KEYS.AUTH_TOKEN);
      // Silent warning - only log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('Unauthorized - handle logout or refresh');
      }
    }
    return Promise.reject(error);
  }
);

export default httpClient;
