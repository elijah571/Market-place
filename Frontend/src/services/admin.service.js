import apiClient from '../utils/apiClient';

export const adminService = {
  async getDashboard() {
    const { data } = await apiClient.get('/admin/dashboard');
    return data?.data;
  },
};
