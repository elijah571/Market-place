import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import errorHandler from './middleware/error.js';
import productRoutes from './routes/product.route.js';
import userRoutes from './routes/user.routes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/user', userRoutes);

app.use(errorHandler);

export default app;
