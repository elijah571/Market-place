import apiClient from '../utils/apiClient';

export const promotionService = {
  async getPromotions() {
    const { data } = await apiClient.get('/promotions');
    return data?.data || [];
  },

  async validatePromoCode(payload) {
    const { data } = await apiClient.post('/promotions/validate', payload);
    return data?.data;
  },
};
