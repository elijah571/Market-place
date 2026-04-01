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
import paymentRoutes from './routes/payment.routes.js';
import paymentWebhookRoutes from './routes/paymentWebhook.routes.js';
import { sanitizeRequest } from './middleware/sanitize.middleware.js';
import errorHandler from './middleware/error.js';

const app = express();

// Security Middlewares
app.use(helmet());
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
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Webhook endpoint needs raw payload for signature verification.
app.use(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentWebhookRoutes
);

app.use(express.json({ limit: '10kb' }));
app.use(sanitizeRequest);

app.use('/api/v1/users', authLimiter);

app.use('/api/v1', productRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);

app.use(errorHandler);
export default app;
