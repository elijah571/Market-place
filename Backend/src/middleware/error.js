import { logger } from '../utils/logger.js';

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = null;

  if (err.name === 'CastError') {
    message = 'Invalid ID';
    statusCode = 400;
  }

  if (err.code === 11000) {
    message = 'Duplicate field value';
    statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token has expired';
    statusCode = 401;
  }

  if (err.name === 'ValidationError') {
    message =
      Object.values(err.errors || {})
        .map((entry) => entry.message)
        .join(', ') || 'Validation failed';
    statusCode = 400;
  }

  if (Array.isArray(err.issues) && err.issues.length > 0) {
    details = err.issues.map((issue) => ({
      path: issue.path,
      message: issue.message,
    }));
    statusCode = 400;
  }

  logger.error(message, {
    requestId: req.id,
    statusCode,
    method: req.method,
    path: req.originalUrl,
    stack: err.stack,
  });

  const payload = {
    success: false,
    message,
    requestId: req.id,
  };

  if (details) {
    payload.details = details;
  }

  if (process.env.NODE_ENV === 'development') {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
