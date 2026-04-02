import APIFunctionality from '../../utils/apiFunctionality.js';
import { AppError } from '../../utils/AppError.js';
import {
  productListProjection,
  productRepository,
} from '../../repositories/product.repository.js';

const getPagination = (query = {}, { admin = false } = {}) => {
  const resultPerPage = Math.min(
    Number(query.limit) || 8,
    admin ? 100 : 50
  );
  const page = Math.max(Number(query.page) || 1, 1);

  return {
    page,
    resultPerPage,
  };
};

const buildCatalogQuery = (query, { admin = false } = {}) => {
  const projection = admin ? undefined : productListProjection;

  return new APIFunctionality(
    productRepository.createCatalogQuery({}, { projection }),
    query
  )
    .search()
    .filter();
};

const formatMetaCategories = (categories = []) => {
  const groupedCategories = categories.reduce((acc, entry) => {
    const categoryName = entry._id?.category || 'Uncategorized';
    if (!acc[categoryName]) {
      acc[categoryName] = {
        label: categoryName,
        count: 0,
        subcategories: [],
      };
    }

    acc[categoryName].count += entry.count;

    if (entry._id?.subcategory) {
      acc[categoryName].subcategories.push({
        label: entry._id.subcategory,
        count: entry.count,
      });
    }

    return acc;
  }, {});

  return Object.values(groupedCategories);
};

const getCatalogListing = async (query, { admin = false } = {}) => {
  const { page, resultPerPage } = getPagination(query, { admin });
  const apiFeatures = buildCatalogQuery(query, { admin });
  const catalogFilter = apiFeatures.query.getFilter();
  const productCount = await productRepository.countCatalog(catalogFilter);
  const totalPage = Math.ceil(productCount / resultPerPage);

  if (page > totalPage && productCount > 0) {
    throw new AppError("This page doesn't exist", 404);
  }

  apiFeatures.sort().pagination(resultPerPage);

  const products = await productRepository.findCatalog(apiFeatures.query);

  return {
    data: products,
    meta: {
      results: products.length,
      productCount,
      resultPerPage,
      totalPage,
      currentPage: page,
    },
  };
};

export const productCatalogService = {
  getPublicCatalog(query) {
    return getCatalogListing(query, { admin: false });
  },

  getAdminCatalog(query) {
    return getCatalogListing(query, { admin: true });
  },

  async getProductMeta() {
    const [categories, priceSummary] = await productRepository.getMeta();

    return {
      categories: formatMetaCategories(categories),
      priceRange: {
        min: Number(priceSummary[0]?.minPrice || 0),
        max: Number(priceSummary[0]?.maxPrice || 0),
      },
    };
  },

  async getSingleProduct(id) {
    const product = await productRepository.incrementViewAndGetById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  },

  async getRecommendations(id) {
    const sourceProduct = await productRepository.findCatalogSeedById(id);

    if (!sourceProduct) {
      throw new AppError('Product not found', 404);
    }

    const recommendations = await productRepository.findRecommendations({
      id,
      category: sourceProduct.category,
      subcategory: sourceProduct.subcategory,
      limit: 8,
    });

    return {
      data: recommendations,
      meta: {
        results: recommendations.length,
      },
    };
  },
};
