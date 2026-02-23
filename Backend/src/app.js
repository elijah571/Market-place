import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import productRoutes from './routes/product.route.js';
import userRoutes from './routes/user.routes.js';
import orderRoutes from './routes/order.routes.js';
import errorHandler from './middleware/error.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use('/api/v1', productRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1', orderRoutes);

app.use(errorHandler);
export default app;
