import httpClient from '@/src/utils/http-client.util';

const url = '/auth';

export const authCommandApi = {
  login: async (data) => {
    const res = await httpClient.post(`${url}/login`, data);
    return res.data;
  },
  register: async (data) => {
    const res = await httpClient.post(`${url}/register`, data);
    return res.data;
  },
  logout: async () => {
    const res = await httpClient.post(`${url}/logout`);
    return res.data;
  },
  // Send OTP to email for forgot password flow
  sendOtp: async (email) => {
    const res = await httpClient.post(`${url}/forgot-password/send-mail`, { email });
    return res.data;
  },
  resetPassword: async (email, newPassword) => {
    const res = await httpClient.post(`${url}/forgot-password/reset-password`, {
      email,
      newPassword,
    });
    return res.data;
  },
  verifyOtp: async (email, otp) => {
    const res = await httpClient.post(`${url}/forgot-password/otp-verification`, { email, otp });
    return res.data;
  },
  changePassword: async (currentPassword, newPassword) => {
    const res = await httpClient.post(`${url}/change-password`, { currentPassword, newPassword });
    return res.data;
  },
};
