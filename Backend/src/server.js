import 'dotenv/config';
import { connectDb, disconnectDb } from './config/db.js';
import app from './app.js';
import { logger } from './utils/logger.js';
import { connectRedis, disconnectRedis } from './utils/redisClient.js';

const PORT = process.env.PORT || 6000;
let server;
let shuttingDown = false;

const startServer = () =>
  new Promise((resolve, reject) => {
    const nextServer = app.listen(PORT, () => {
      logger.info('Server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
      });
      resolve(nextServer);
    });

    nextServer.on('error', reject);
  });

const shutdown = (signal, error = null) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (error) {
    logger.error(`Process shutting down after ${signal}`, {
      message: error.message,
      stack: error.stack,
    });
  } else {
    logger.info(`Process received ${signal}, shutting down gracefully`);
  }

  if (!server) {
    Promise.allSettled([disconnectDb(), disconnectRedis()]).finally(() => {
      process.exit(error ? 1 : 0);
    });
    return;
  }

  server.close(async () => {
    await Promise.allSettled([disconnectDb(), disconnectRedis()]);
    process.exit(error ? 1 : 0);
  });
};

const bootstrap = async () => {
  await connectDb();
  server = await startServer();

  void connectRedis().catch((error) => {
    shutdown('redis_connection_error', error);
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
