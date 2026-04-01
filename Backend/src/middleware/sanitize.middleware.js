import { AppError } from '../utils/AppError.js';

const hasUnsafeKey = (value) => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  for (const key of Object.keys(value)) {
    if (key.includes('$') || key.includes('.')) {
      return true;
    }

    const child = value[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (hasUnsafeKey(item)) {
          return true;
        }
      }
    } else if (hasUnsafeKey(child)) {
      return true;
    }
  }

  return false;
};

export const sanitizeRequest = (req, res, next) => {
  if (hasUnsafeKey(req.body) || hasUnsafeKey(req.query) || hasUnsafeKey(req.params)) {
    throw new AppError('Unsafe input payload detected', 400);
  }

  next();
};
