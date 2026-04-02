import apiClient from '../utils/apiClient';

export const storefrontService = {
  async getHomeCollections() {
    const [mostViewedRes, topRatedRes, metaRes] = await Promise.all([
      apiClient.get('/products?limit=8&sort=viewedDesc'),
      apiClient.get('/products?limit=8&sort=ratingDesc'),
      apiClient.get('/products/meta'),
    ]);

    return {
      mostViewed: mostViewedRes.data?.data || [],
      topRated: topRatedRes.data?.data || [],
      meta: metaRes.data?.data || { categories: [], priceRange: { min: 0, max: 5000 } },
    };
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
