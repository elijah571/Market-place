const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseFilterValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => parseFilterValue(entry));
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (trimmed === 'true') {
    return true;
  }

  if (trimmed === 'false') {
    return false;
  }

  return trimmed;
};

class APIFunctionality {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  search() {
    const keyword = String(this.queryStr.keyword || '').trim();

    if (!keyword) {
      return this;
    }

    const safeKeyword = escapeRegex(keyword);

    this.query = this.query.find({
      $or: [
        { name: { $regex: safeKeyword, $options: 'i' } },
        { description: { $regex: safeKeyword, $options: 'i' } },
        { brand: { $regex: safeKeyword, $options: 'i' } },
        { category: { $regex: safeKeyword, $options: 'i' } },
        { tags: { $regex: safeKeyword, $options: 'i' } },
        { slug: { $regex: safeKeyword, $options: 'i' } },
        { 'variants.sku': { $regex: safeKeyword, $options: 'i' } },
      ],
    });

    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };
    const removeFields = ['keyword', 'page', 'limit', 'sort'];
    removeFields.forEach((key) => delete queryCopy[key]);

    const filter = Object.entries(queryCopy).reduce((acc, [rawKey, rawValue]) => {
      if (rawValue === undefined || rawValue === null || rawValue === '') {
        return acc;
      }

      const operatorMatch = rawKey.match(/^([^[\]]+)\[(gte|gt|lte|lt|in)\]$/);

      if (operatorMatch) {
        const [, field, operator] = operatorMatch;
        const normalizedValue =
          operator === 'in' && typeof rawValue === 'string'
            ? rawValue
                .split(',')
                .map((value) => parseFilterValue(value))
                .filter(Boolean)
            : parseFilterValue(rawValue);

        acc[field] = {
          ...(acc[field] || {}),
          [`$${operator}`]: normalizedValue,
        };
        return acc;
      }

      if (rawKey === 'category' && typeof rawValue === 'string') {
        const categories = rawValue
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);

        acc.category = categories.length > 1 ? { $in: categories } : categories[0];
        return acc;
      }

      acc[rawKey] = parseFilterValue(rawValue);
      return acc;
    }, {});

    this.query = this.query.find(filter);
    return this;
  }

  sort() {
    const sortBy = String(this.queryStr.sort || '').trim();

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      priceAsc: { price: 1, createdAt: -1 },
      priceDesc: { price: -1, createdAt: -1 },
      ratingDesc: { rating: -1, numOfReviews: -1, createdAt: -1 },
      popular: { numOfReviews: -1, rating: -1, createdAt: -1 },
      viewedDesc: { viewCount: -1, createdAt: -1 },
      stockDesc: { stock: -1, createdAt: -1 },
    };

    this.query = this.query.sort(sortMap[sortBy] || sortMap.newest);
    return this;
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resultPerPage * (currentPage - 1);
    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

export default APIFunctionality;
