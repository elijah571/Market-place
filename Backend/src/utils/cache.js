const cacheStore = new Map();

const normalizeCacheKey = (req) => `${req.method}:${req.originalUrl}`;

export const withCache = (ttlMs = 60 * 1000) => (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = normalizeCacheKey(req);
  const cached = cacheStore.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return res.status(cached.statusCode).json(cached.payload);
  }

  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (res.statusCode < 400) {
      cacheStore.set(key, {
        expiresAt: Date.now() + ttlMs,
        statusCode: res.statusCode,
        payload,
      });
    }

    return originalJson(payload);
  };

  return next();
};

export const clearCache = (predicate = null) => {
  if (!predicate) {
    cacheStore.clear();
    return;
  }

  for (const key of cacheStore.keys()) {
    if (predicate(key)) {
      cacheStore.delete(key);
    }
  }
};

export const clearCommerceCache = () => {
  clearCache((key) =>
    key.includes('/products') ||
    key.includes('/product/') ||
    key.includes('/admin/dashboard') ||
    key.includes('/admin/order') ||
    key.includes('/orders')
  );
};
