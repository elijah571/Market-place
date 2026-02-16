const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      success: false,
      message,
      stack: err.stack,
    });
  }

  if (err.name === 'CastError') {
    message = `Invalid ID`;
    statusCode = 400;
  }

  if (err.code === 11000) {
    message = 'Duplicate field value';
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

export default errorHandler;
