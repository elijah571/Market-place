import { createClient } from 'redis';
import { logger } from './logger.js';

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const buildRedisUrl = () => {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host =
    process.env.REDIS_CLOUD_URL ||
    process.env.REDIS_HOST ||
    process.env.REDISHOST ||
    '';

  if (!host) {
    return '';
  }

  const port =
    process.env.REDIS_CLOUD_PORT ||
    process.env.REDIS_PORT ||
    process.env.REDISPORT ||
    '6379';
  const password = encodeURIComponent(
    process.env.REDIS_CLOUD_PASSWORD ||
      process.env.REDIS_PASSWORD ||
      process.env.REDISPASSWORD ||
      ''
  );
  const username = encodeURIComponent(process.env.REDIS_USERNAME || 'default');
  const useTls = parseBoolean(process.env.REDIS_TLS, false);
  const protocol = useTls ? 'rediss' : 'redis';

  return password
    ? `${protocol}://${username}:${password}@${host}:${port}`
    : `${protocol}://${host}:${port}`;
};

const redisUrl = buildRedisUrl();
const redisEnabled = parseBoolean(process.env.REDIS_ENABLED, Boolean(redisUrl));
const redisRequired = parseBoolean(process.env.REDIS_REQUIRED, false);
const rejectUnauthorized = parseBoolean(process.env.REDIS_TLS_REJECT_UNAUTHORIZED, true);

let ready = false;

const redisClientOptions =
  redisEnabled && redisUrl
    ? {
        url: redisUrl,
        socket:
          redisUrl.startsWith('rediss://') || parseBoolean(process.env.REDIS_TLS, false)
            ? { tls: true, rejectUnauthorized }
            : undefined,
      }
    : null;

export const redisClient = redisClientOptions ? createClient(redisClientOptions) : null;

if (redisClient) {
  redisClient.on('ready', () => {
    ready = true;
    logger.info('Redis client ready');
  });

  redisClient.on('end', () => {
    ready = false;
    logger.warn('Redis client disconnected');
  });

  redisClient.on('error', (error) => {
    ready = false;
    logger.error('Redis client error', {
      message: error.message,
    });
  });
}

export const isRedisEnabled = () => Boolean(redisClient);
export const isRedisReady = () => Boolean(redisClient?.isReady && ready);

export const connectRedis = async () => {
  if (!redisClient || redisClient.isOpen || redisClient.isReady) {
    return isRedisReady();
  }

  try {
    await redisClient.connect();
    return true;
  } catch (error) {
    ready = false;
    logger.error('Redis connection failed', {
      message: error.message,
      urlConfigured: Boolean(redisUrl),
    });

    if (redisRequired) {
      throw error;
    }

    return false;
  }
};

export const disconnectRedis = async () => {
  if (!redisClient?.isOpen) {
    return;
  }

  try {
    await redisClient.quit();
  } catch (error) {
    logger.warn('Redis quit failed, forcing disconnect', {
      message: error.message,
    });
    await redisClient.disconnect();
  }
};

export const withRedis = async (operation, fallback = null) => {
  if (!isRedisReady()) {
    return fallback;
  }

  try {
    return await operation(redisClient);
  } catch (error) {
    logger.warn('Redis operation failed', {
      message: error.message,
    });
    return fallback;
  }
};
