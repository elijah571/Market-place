import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const isMongoReady = () => mongoose.connection.readyState === 1;

export const connectDb = async () => {
  try {
    mongoose.set('strictQuery', true);

    const data = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
      minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 5),
      serverSelectionTimeoutMS: Number(
        process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 5000
      ),
      socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS || 45000),
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    logger.info('MongoDB connected', {
      host: data.connection.host,
      name: data.connection.name,
    });
  } catch (error) {
    logger.error('MongoDB connection error', {
      message: error.message,
    });
    process.exit(1);
  }
};

export const disconnectDb = async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
};
