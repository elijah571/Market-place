import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { sendResetEmail, sendVerificationEmail } from '../utils/sendMail.js';
import { generateToken } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  uploadsToCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';

const passwordOptions = {
  minLength: 6,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

/* ===============================
   SIGN UP
================================= */
export const signUp = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    throw new AppError('All fields are required', 400);
  }

  if (!validator.isEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }

  if (!validator.isStrongPassword(password, passwordOptions)) {
    throw new AppError(
      'Password must include uppercase, lowercase, number and symbol',
      400
    );
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already exists', 400);
  }

  /* ===============================
     HASH PASSWORD
  ================================= */
  const hashedPassword = await bcrypt.hash(password, 10);

  /* ===============================
     EMAIL VERIFICATION TOKEN
  ================================= */
  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const verificationTokenExpiresAt = Date.now() + 60 * 60 * 1000;

  /* ===============================
     AVATAR UPLOAD (NEW PART)
  ================================= */
  let avatarData = {
    public_id: 'default_id',
    url: 'default_url',
  };

  let uploadedImage = null;

  if (req.file) {
    uploadedImage = await uploadsToCloudinary(req.file.buffer, 'user_avatars');

    avatarData = {
      public_id: uploadedImage.public_id,
      url: uploadedImage.secure_url,
    };
  }
  /* ===============================
     CREATE USER
  ================================= */
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    avatar: avatarData,
    verificationToken,
    verificationTokenExpiresAt,
  });

  await sendVerificationEmail(email, verificationToken);

  user.password = undefined;

  res.status(201).json({
    status: 'success',
    message: 'User created successfully. Check your email for verification.',
    user,
  });
});
/* ===============================
   VERIFY ACCOUNT
================================= */
export const verifyAccount = asyncHandler(async (req, res) => {
  const { verificationToken } = req.body;

  const user = await User.findOne({ verificationToken });

  if (!user) {
    throw new AppError('Invalid or expired verification token', 400);
  }

  if (user.verificationTokenExpiresAt < Date.now()) {
    throw new AppError('Verification token has expired', 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Account verified successfully',
  });
});

/* ===============================
   LOGIN
================================= */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password', 400);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 400);
  }

  generateToken(res, user._id);

  user.password = undefined;

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    user,
  });
});

/* ===============================
   LOGOUT
================================= */
export const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/* ===============================
   SEND RESET TOKEN
================================= */
export const resetPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError('User does not exist', 404);
  }

  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000;

  await user.save();

  await sendResetEmail(email, resetToken);

  res.status(200).json({
    status: 'success',
    message: 'Reset password token sent to email',
  });
});

/* ===============================
   RESET PASSWORD
================================= */
export const resetPassword = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    throw new AppError('Reset token and new password are required', 400);
  }

  if (!validator.isStrongPassword(newPassword, passwordOptions)) {
    throw new AppError(
      'New password must include uppercase, lowercase, number and symbol',
      400
    );
  }

  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.resetPasswordToken !== resetToken) {
    throw new AppError('Invalid reset token', 400);
  }

  if (user.resetPasswordExpiresAt < Date.now()) {
    throw new AppError('Reset token has expired', 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
  });
});

/* ===============================
   UPDATE PROFILE
================================= */
export const updateProfile = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, email, role } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  /* ===============================
     AVATAR UPLOAD
  ================================= */
  if (req.file) {
    // delete old avatar if exists
    if (user.avatar?.public_id && user.avatar.public_id !== 'default_id') {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    // upload new avatar
    const uploadedImage = await uploadsToCloudinary(
      req.file.buffer,
      'user_avatars'
    );

    user.avatar = {
      public_id: uploadedImage.public_id,
      url: uploadedImage.secure_url,
    };
  }

  /* ===============================
     ROLE UPDATE
  ================================= */
  if (role && req.user.role !== 'admin') {
    throw new AppError('Only admins can update roles', 403);
  }

  if (role) {
    const validRoles = ['admin', 'user'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role provided', 400);
    }
    user.role = role;
  }

  /* ===============================
     EMAIL UPDATE
  ================================= */
  if (email) {
    if (!validator.isEmail(email)) {
      throw new AppError('Invalid email format', 400);
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser._id.toString() !== userId) {
      throw new AppError('Email already taken', 400);
    }

    user.email = email;
  }

  if (name) user.name = name;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    user,
  });
});

/* ===============================
   GET ALL USERS
================================= */
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');

  res.status(200).json({
    status: 'success',
    results: users.length,
    users,
  });
});

/* ===============================
   GET USER BY ID
================================= */
export const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    status: 'success',
    user,
  });
});

/* ===============================
   DELETE USER
================================= */
export const deleteUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await user.deleteOne();

  res.status(200).json({
    status: 'success',
    message: 'User deleted successfully',
  });
});

/* ===============================
   CHANGE PASSWORD
================================= */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new AppError('All password fields are required', 400);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', 400);
  }

  if (!validator.isStrongPassword(newPassword, passwordOptions)) {
    throw new AppError(
      'Password must include uppercase, lowercase, number and symbol',
      400
    );
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    throw new AppError('New password cannot be same as old password', 400);
  }

  user.password = await bcrypt.hash(newPassword, 10);

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
  });
});
