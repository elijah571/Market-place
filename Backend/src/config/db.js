import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDb = async () => {
  try {
    const data = await mongoose.connect(process.env.MONGO_URI);
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
