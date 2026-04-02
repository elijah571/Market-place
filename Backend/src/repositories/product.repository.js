import { Product } from '../models/product.model.js';

export const productListProjection =
  'name price image rating numOfReviews category subcategory stock colors sizes variants createdAt viewCount';

export const productRepository = {
  createCatalogQuery(filter = {}, { projection = productListProjection } = {}) {
    return Product.find(filter).select(projection);
  },

  countCatalog(filter = {}) {
    return Product.countDocuments(filter);
  },

  findCatalog(query) {
    return query.lean();
  },

  getMeta() {
    return Promise.all([
      Product.aggregate([
        {
          $group: {
            _id: {
              category: '$category',
              subcategory: '$subcategory',
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            '_id.category': 1,
            '_id.subcategory': 1,
          },
        },
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            minPrice: { $min: '$price' },
            maxPrice: { $max: '$price' },
          },
        },
      ]),
    ]);
  },

  incrementViewAndGetById(id) {
    return Product.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true, runValidators: false }
    ).lean();
  },

  findCatalogSeedById(id) {
    return Product.findById(id).select('category subcategory').lean();
  },

  findRecommendations({ id, category, subcategory, limit = 8 }) {
    const orConditions = [];

    if (subcategory) {
      orConditions.push({ subcategory });
    }

    if (category) {
      orConditions.push({ category });
    }

    return Product.find({
      _id: { $ne: id },
      ...(orConditions.length > 0 ? { $or: orConditions } : {}),
    })
      .select(productListProjection)
      .sort({ rating: -1, viewCount: -1, createdAt: -1 })
      .limit(limit)
      .lean();
  },
};
