import dotenv from 'dotenv';
import { connectDb } from './config/db.js';
import app from './app.js';
import { logger } from './utils/logger.js';

dotenv.config();

const PORT = process.env.PORT || 6000;
let server;

const shutdown = (signal, error = null) => {
  if (error) {
    logger.error(`Process shutting down after ${signal}`, {
      message: error.message,
      stack: error.stack,
    });
  } else {
    logger.info(`Process received ${signal}, shutting down gracefully`);
  }

  if (!server) {
    process.exit(error ? 1 : 0);
    return;
  }

  server.close(() => {
    process.exit(error ? 1 : 0);
  });
};

const bootstrap = async () => {
  await connectDb();

  server = app.listen(PORT, () => {
    logger.info('Server started', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
    });
  });
};

bootstrap().catch((error) => shutdown('bootstrap_error', error));

process.on('unhandledRejection', (err) => {
  shutdown('unhandledRejection', err);
});

process.on('uncaughtException', (err) => {
  shutdown('uncaughtException', err);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
