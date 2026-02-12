import HandleError from '../utils/handleError.js';

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Cast Error (Invalid Mongo ID)
  if (err.name === 'CastError') {
    message = `Invalid resource ID: ${err.path}`;
    statusCode = 400;
  }

  // Duplicate key error
  if (err.code === 11000) {
    message = `Duplicate field value entered`;
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;
