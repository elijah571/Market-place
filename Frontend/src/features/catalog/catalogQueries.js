import { useQuery } from '@tanstack/react-query';
import { storefrontService } from '../../services/storefront.service';

const emptyMeta = {
  categories: [],
  priceRange: { min: 0, max: 5000 },
};

export const catalogQueryKeys = {
  homeCollections: ['catalog', 'home-collections'],
  meta: ['catalog', 'meta'],
  recommendations: (productId) => ['catalog', 'recommendations', productId],
};

export const useHomeCollections = () =>
  useQuery({
    queryKey: catalogQueryKeys.homeCollections,
    queryFn: storefrontService.getHomeCollections,
    placeholderData: {
      mostViewed: [],
      topRated: [],
      meta: emptyMeta,
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCatalogMeta = () =>
  useQuery({
    queryKey: catalogQueryKeys.meta,
    queryFn: storefrontService.getProductMeta,
    placeholderData: emptyMeta,
    staleTime: 10 * 60 * 1000,
  });

export const useProductRecommendations = (productId) =>
  useQuery({
    queryKey: catalogQueryKeys.recommendations(productId),
    queryFn: () => storefrontService.getProductRecommendations(productId),
    enabled: Boolean(productId),
    placeholderData: [],
    staleTime: 5 * 60 * 1000,
  });
