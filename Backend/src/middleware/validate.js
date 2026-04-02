import { AppError } from '../utils/AppError.js';

const assignValidatedData = (req, target, parsedData) => {
  const currentValue = req[target];

  if (
    currentValue &&
    typeof currentValue === 'object' &&
    !Array.isArray(currentValue)
  ) {
    for (const key of Object.keys(currentValue)) {
      delete currentValue[key];
    }

    Object.assign(currentValue, parsedData);
    return;
  }

  req[target] = parsedData;
};

/**
 * Lightweight Zod validator for request segments.
 * Usage: validate(schema, 'body' | 'query' | 'params')
 */
export const validate = (schema, target = 'body') => (req, _res, next) => {
  const data = req[target] ?? {};
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ');
    const error = new AppError(message || 'Invalid input', 400);
    error.issues = parsed.error.issues;
    return next(error);
  }
  assignValidatedData(req, target, parsed.data);
  return next();
};
