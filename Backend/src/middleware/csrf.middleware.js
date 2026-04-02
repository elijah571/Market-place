import { AppError } from '../utils/AppError.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const getAllowedOrigins = () =>
  String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const enforceCsrfOrigin = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const hasAuthCookie = Boolean(req.cookies?.accessToken || req.cookies?.refreshToken);

  if (!hasAuthCookie) {
    return next();
  }

  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  const allowedOrigins = getAllowedOrigins();

  if (!allowedOrigins.length) {
    return next();
  }

  const matchesAllowedOrigin = allowedOrigins.some(
    (allowedOrigin) =>
      origin === allowedOrigin || referer.startsWith(`${allowedOrigin}/`) || referer === allowedOrigin
  );

  if (!matchesAllowedOrigin) {
    return next(new AppError('Request origin is not allowed', 403));
  }

  return next();
};
