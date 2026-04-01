const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
        { category: { $regex: safeKeyword, $options: 'i' } },
        { 'variants.sku': { $regex: safeKeyword, $options: 'i' } },
      ],
    });

    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    const removeFields = ['keyword', 'page', 'limit', 'sort'];
    removeFields.forEach((key) => delete queryCopy[key]);

    if (queryCopy.category && typeof queryCopy.category === 'string') {
      const categories = queryCopy.category
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      queryCopy.category = categories.length > 1 ? { in: categories } : categories[0];
    }

    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));
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
