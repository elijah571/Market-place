import handleAsyncErrror from '../middleware/handleAsyncErrror.js';
import { User } from '../models/user.model.js';
import HandleError from '../utils/handleError.js';
import bcrypt from 'bcryptjs';

export const registerUser = handleAsyncErrror(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  //  check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new HandleError('Email already registered', 400));
  }

  //create user
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: 'public_id',
      url: 'url',
    },
    role,
  });

  const token = user.getJWTTOKEN();
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user,
    token,
  });
});
