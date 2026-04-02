import crypto from 'node:crypto';
import { logger } from './logger.js';
import { isRedisReady, withRedis } from './redisClient.js';

export const CACHE_TTLS = {
  productCatalog: 5 * 60,
  productMeta: 30 * 60,
  productDetails: 5 * 60,
  recommendations: 10 * 60,
  homepage: 10 * 60,
  cart: 60,
  orders: 2 * 60,
  transactions: 2 * 60,
  adminDashboard: 3 * 60,
  wishlist: 2 * 60,
  recentlyViewed: 60,
  profile: 2 * 60,
};

const CACHE_PREFIX = 'marketplace-cache';
const CACHE_TAG_PREFIX = `${CACHE_PREFIX}:tag`;

const unique = (values = []) => [...new Set(values.filter(Boolean))];

const toSeconds = (value) => {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) {
    return 60;
  }

  const numericValue = Number(value);
  return numericValue > 1000 ? Math.ceil(numericValue / 1000) : Math.ceil(numericValue);
};

const buildHashedKey = (parts = []) =>
  crypto
    .createHash('sha1')
    .update(parts.join('::'))
    .digest('hex');

const getUserId = (req) => req.user?._id?.toString?.() || req.user?.id || 'guest';

const createCacheKey = ({ namespace = 'default', req, keyBuilder, varyByUser = false }) => {
  const dynamicKey =
    typeof keyBuilder === 'function'
      ? keyBuilder(req)
      : `${req.method}:${req.originalUrl}`;

  return `${CACHE_PREFIX}:${namespace}:${buildHashedKey([
    dynamicKey,
    varyByUser ? getUserId(req) : 'public',
  ])}`;
};

const createTagKey = (tag) => `${CACHE_TAG_PREFIX}:${tag}`;

const resolveTags = ({ tags, req, payload }) => {
  const resolvedTags = typeof tags === 'function' ? tags(req, payload) : tags;
  return unique(Array.isArray(resolvedTags) ? resolvedTags : [resolvedTags]);
};

const registerTagsForKey = async (cacheKey, tags, ttlSeconds) => {
  if (!tags.length) {
    return;
  }

  await withRedis(async (client) => {
    const pipeline = client.multi();

    tags.forEach((tag) => {
      const tagKey = createTagKey(tag);
      pipeline.sAdd(tagKey, cacheKey);
      pipeline.expire(tagKey, Math.max(ttlSeconds, 60));
    });

    await pipeline.exec();
  });
};

export const withCache = (options = {}) => {
  const normalizedOptions =
    typeof options === 'number'
      ? {
          ttlSeconds: toSeconds(options),
        }
      : {
          namespace: options.namespace || 'default',
          ttlSeconds: toSeconds(options.ttlSeconds || options.ttl || 60),
          varyByUser: Boolean(options.varyByUser),
          keyBuilder: options.keyBuilder,
          tags: options.tags || [],
          shouldCache: options.shouldCache,
        };

  return async (req, res, next) => {
    if (req.method !== 'GET' || !isRedisReady()) {
      return next();
    }

    const cacheKey = createCacheKey({
      namespace: normalizedOptions.namespace,
      req,
      keyBuilder: normalizedOptions.keyBuilder,
      varyByUser: normalizedOptions.varyByUser,
    });

    const cached = await withRedis(async (client) => client.get(cacheKey));

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return res.status(parsed.statusCode || 200).json(parsed.payload);
      } catch (error) {
        logger.warn('Failed to parse cached payload', {
          cacheKey,
          message: error.message,
        });
      }
    }

    const originalJson = res.json.bind(res);

    res.json = (payload) => {
      const shouldCache =
        typeof normalizedOptions.shouldCache === 'function'
          ? normalizedOptions.shouldCache(req, payload, res)
          : true;

      if (shouldCache && res.statusCode < 400) {
        const ttlSeconds = normalizedOptions.ttlSeconds;
        const resolvedTags = resolveTags({
          tags: normalizedOptions.tags,
          req,
          payload,
        });

        void withRedis(async (client) => {
          await client.setEx(
            cacheKey,
            ttlSeconds,
            JSON.stringify({
              statusCode: res.statusCode,
              payload,
            })
          );

          await registerTagsForKey(cacheKey, resolvedTags, ttlSeconds);
        });
      }

      return originalJson(payload);
    };

    return next();
  };
};

export const invalidateCacheByTags = (tags = []) => {
  const normalizedTags = unique(tags);

  if (!normalizedTags.length) {
    return;
  }

  void withRedis(async (client) => {
    const tagKeys = normalizedTags.map(createTagKey);
    const keyGroups = await Promise.all(tagKeys.map((tagKey) => client.sMembers(tagKey)));
    const cacheKeys = unique(keyGroups.flat());

    const pipeline = client.multi();

    if (cacheKeys.length) {
      pipeline.del(cacheKeys);
    }

    if (tagKeys.length) {
      pipeline.del(tagKeys);
    }

    await pipeline.exec();
  });
};

export const getUserCacheTags = (userId) => {
  const resolvedUserId = String(userId || '').trim();

  if (!resolvedUserId) {
    return [];
  }

  return [
    `profile:${resolvedUserId}`,
    `wishlist:${resolvedUserId}`,
    `recently-viewed:${resolvedUserId}`,
    `cart:${resolvedUserId}`,
    `orders:${resolvedUserId}`,
    `transactions:${resolvedUserId}`,
  ];
};

export const clearProductCache = (productId = '') => {
  invalidateCacheByTags([
    'catalog',
    'catalog-meta',
    'homepage',
    'product-reviews',
    'product-recommendations',
    'admin-dashboard',
    productId ? `product:${productId}` : '',
  ]);
};

export const clearCartCache = (userId = '') => {
  invalidateCacheByTags(['cart', ...getUserCacheTags(userId)]);
};

export const clearOrderCache = (userId = '') => {
  invalidateCacheByTags(['orders', 'transactions', 'admin-dashboard', ...getUserCacheTags(userId)]);
};

export const clearUserCache = (userId = '') => {
  invalidateCacheByTags(['users', 'admin-dashboard', ...getUserCacheTags(userId)]);
};

export const clearCommerceCache = (userId = '') => {
  invalidateCacheByTags([
    'catalog',
    'catalog-meta',
    'homepage',
    'product-reviews',
    'product-recommendations',
    'cart',
    'orders',
    'transactions',
    'admin-dashboard',
    ...getUserCacheTags(userId),
  ]);
};
