import { User } from '../models/user.model.js';
import { asyncHandler } from './asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { getAccessTokenFromRequest, verifyAccessToken } from '../utils/token.js';

// Middleware to check if user is authenticated
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);

  if (!token) {
    throw new AppError('Not authenticated', 401);
  }

  const decoded = verifyAccessToken(token);

  if (decoded.type !== 'access') {
    throw new AppError('Invalid token type', 401);
  }

  const user = await User.findById(decoded.userId).select(
    '-password +tokenVersion'
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isVerified) {
    throw new AppError('Verify your account before accessing this resource', 403);
  }

  if (decoded.tokenVersion !== user.tokenVersion) {
    throw new AppError('Session expired. Please login again.', 401);
  }

  req.user = user;
  next();
});

export const authorizeRoles = (...allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    const user = req.user;

    if (!user) {
      throw new AppError('User is not authenticated', 401);
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AppError(
        'You do not have permission to access this resource',
        403
      );
    }

    next();
  });

// Admin has full access to everything, including Shipper routes
export const isAdmin = asyncHandler(async (req, res, next) => {
  const user = req.user;

  if (!user) {
    throw new AppError('User is not authenticated', 401);
  }

  if (user.role !== 'admin') {
    throw new AppError(
      'You do not have permission to access this resource',
      403
    );
  }

  next();
});
