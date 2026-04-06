import { AppError } from '../utils/AppError.js';
import {
  doesRequestMatchAllowedFrontendOrigin,
  getConfiguredFrontendOrigins,
} from '../utils/frontendOrigins.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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
  const allowedOrigins = getConfiguredFrontendOrigins();

  if (!allowedOrigins.length) {
    return next();
  }

  if (
    !doesRequestMatchAllowedFrontendOrigin({
      origin,
      referer,
      allowedOrigins,
    })
  ) {
    return next(new AppError('Request origin is not allowed', 403));
  }

  return next();
};
