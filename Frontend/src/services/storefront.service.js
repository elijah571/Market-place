import apiClient from '../utils/apiClient';

export const storefrontService = {
  async getHomeCollections() {
    const { data } = await apiClient.get('/products/home');
    return (
      data?.data || {
        mostViewed: [],
        topRated: [],
        meta: { categories: [], priceRange: { min: 0, max: 5000 } },
      }
    );
  },

  async getProductCatalog(params) {
    const query = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.set(key, String(value));
      }
    });

    const { data } = await apiClient.get(`/products?${query.toString()}`);
    return data;
  },

  async getProductMeta() {
    const { data } = await apiClient.get('/products/meta');
    return data?.data;
  },

  async getProductRecommendations(id) {
    const { data } = await apiClient.get(`/product/${id}/recommendations`);
    return data?.data || [];
  },

  async submitReview(payload) {
    const { data } = await apiClient.put('/product/reviews', payload);
    return data;
  },
};
