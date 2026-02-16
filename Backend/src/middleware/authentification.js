import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { asyncHandler } from './asyncHandler.js';
import { AppError } from '../utils/AppError.js';

// Middleware to check if user is authenticated
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new AppError('Not authenticated', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.userId).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  req.user = user;
  next();
});

// Admin has full access to everything, including Shipper routes
export const isAdmin = async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(403).json({ message: 'User is not authenticated' });
  }

  if (user.role !== 'admin') {
    return res
      .status(403)
      .json({ message: 'You do not have permission to access this resource' });
  }

  next();
};
