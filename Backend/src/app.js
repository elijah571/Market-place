import express from 'express';
import cors from 'cors';
import productRoutes from './routes/product.route.js';
import userRoutes from './routes/user.routes.js';
import errorHandler from './middleware/error.js';
const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/v1', productRoutes);
//user
app.use('/api/v1/user', userRoutes);

app.use(errorHandler);

export default app;
