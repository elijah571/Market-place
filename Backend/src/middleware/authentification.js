import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

// Middleware to check if user is authenticated
export const isAuthenticateUser = async (req, res, next) => {
  let token;

  // Check if the token is provided in the cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Token is required' });
    }

    try {
      // Verify the token using jwt.verify
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      console.log('Decoded Token:', decoded);

      // Retrieve the user from the database using the userId from the decoded token
      const user = await User.findById(decoded.userId);

      console.log('User found:', user);

      if (!user) {
        return res
          .status(404)
          .json({ message: 'User authentication not found' });
      }

      req.user = user;

      next();
    } catch (error) {
      console.error('JWT Error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } else {
    return res.status(401).json({ message: 'Authorization token is missing' });
  }
};

// Admin has full access to everything, including Shipper routes
export const isAdmin = async (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(403).json({ message: 'User is not authenticated' });
  }

  if (user.role !== 'Admin') {
    return res
      .status(403)
      .json({ message: 'You do not have permission to access this resource' });
  }

  next();
};
