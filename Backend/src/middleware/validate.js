import { AppError } from '../utils/AppError.js';

/**
 * Lightweight Zod validator for request segments.
 * Usage: validate(schema, 'body' | 'query' | 'params')
 */
export const validate = (schema, target = 'body') => (req, _res, next) => {
  const data = req[target] ?? {};
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    return next(new AppError(message || 'Invalid input', 400));
  }
  req[target] = parsed.data;
  return next();
};
