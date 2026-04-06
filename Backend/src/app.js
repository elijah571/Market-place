import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';

import productRoutes from './routes/product.route.js';
import userRoutes from './routes/user.routes.js';
import orderRoutes from './routes/order.routes.js';
import cartRoutes from './routes/cart.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';
import promotionRoutes from './routes/promotion.routes.js';
import { sanitizeRequest } from './middleware/sanitize.middleware.js';
import { enforceCsrfOrigin } from './middleware/csrf.middleware.js';
import errorHandler from './middleware/error.js';
import { logger } from './utils/logger.js';
import { isMongoReady } from './config/db.js';
import { isRedisEnabled, isRedisReady } from './utils/redisClient.js';

const app = express();
const allowedOrigins = String(process.env.FRONTEND_URL || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
app.use(cookieParser());

app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/v1/health' || req.path === '/api/v1/ready',
});

const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/v1/health' || req.path === '/api/v1/ready',
});

app.use(
  morgan(
    process.env.NODE_ENV === 'development'
      ? 'dev'
      : ':method :url :status :response-time ms - :res[content-length]',
    {
      stream: {
        write: (message) => {
          logger.info('http_request', { request: message.trim() });
        },
      },
    }
  )
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(sanitizeRequest);
app.use(enforceCsrfOrigin);
app.use('/api/v1', generalLimiter);

app.use('/api/v1/users', authLimiter);
app.get('/api/v1/health', (_req, res) =>
  res.status(200).json({
    success: true,
    message: 'Marketplace API is healthy',
    timestamp: new Date().toISOString(),
  })
);
app.get('/api/v1/ready', (_req, res) => {
  const mongoReady = isMongoReady();
  const redisReady = !isRedisEnabled() || isRedisReady();

  const statusCode = mongoReady && redisReady ? 200 : 503;

  return res.status(statusCode).json({
    success: statusCode === 200,
    message: statusCode === 200 ? 'Marketplace API is ready' : 'Dependencies not ready',
    services: {
      mongodb: mongoReady ? 'ready' : 'unavailable',
      redis: isRedisEnabled() ? (redisReady ? 'ready' : 'unavailable') : 'disabled',
    },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1', productRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1', cartRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1', adminRoutes);
app.use('/api/v1', promotionRoutes);

app.use(errorHandler);
export default app;
