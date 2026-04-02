import apiClient from '../utils/apiClient';

export const accountService = {
  async addAddress(payload) {
    const { data } = await apiClient.post('/users/me/addresses', payload);
    return data;
  },

  async updateAddress(id, payload) {
    const { data } = await apiClient.put(`/users/me/addresses/${id}`, payload);
    return data;
  },

  async removeAddress(id) {
    const { data } = await apiClient.delete(`/users/me/addresses/${id}`);
    return data;
  },

  async getMyOrders(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });

    const { data } = await apiClient.get(`/orders?${query.toString()}`);
    return data;
  },

  async getOrderDetails(id) {
    const { data } = await apiClient.get(`/order/${id}`);
    return data;
  },
};
