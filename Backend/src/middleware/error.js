import HandleError from '../utils/handleError.js';

export default (err, req, res, next) => {
  err.statuCode = err.statuCode || 500;
  err.message = err.message || 'Internal Server error';

  //castError
  if (err.name === 'CastError') {
    const message = `This is inValid resource ${err.path}`;
    err = new HandleError(message, 404);
  }

  res.status(err.statuCode).json({
    success: false,
    message: err.message,
  });
  next();
};
