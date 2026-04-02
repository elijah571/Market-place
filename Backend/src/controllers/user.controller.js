import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { sendResetEmail, sendVerificationEmail } from '../utils/sendMail.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  uploadsToCloudinary,
  deleteFromCloudinary,
} from '../utils/cloudinary.js';
import {
  clearAuthCookies,
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
  hashToken,
  issueAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/token.js';

const passwordOptions = {
  minLength: 6,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

const serializeUser = (userDoc) => {
  if (!userDoc) {
    return null;
  }

  const user =
    typeof userDoc.toObject === 'function' ? userDoc.toObject() : { ...userDoc };

  delete user.password;
  delete user.tokenVersion;
  delete user.refreshTokenHash;
  delete user.refreshTokenExpiresAt;
  delete user.verificationToken;
  delete user.verificationTokenExpiresAt;
  delete user.resetPasswordToken;
  delete user.resetPasswordExpiresAt;

  return user;
};

const buildAuthenticatedSession = async (res, user) => {
  const { accessToken } = await issueAuthTokens(res, user);

  return {
    authenticated: true,
    accessToken,
    user: serializeUser(user),
  };
};

/* ===============================
   SIGN UP
================================= */
export const signUp = asyncHandler(async (req, res) => {
  const { email, name, password } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!email || !name || !password) {
    throw new AppError('All fields are required', 400);
  }

  if (!validator.isEmail(normalizedEmail)) {
    throw new AppError('Invalid email format', 400);
  }

  if (!validator.isStrongPassword(password, passwordOptions)) {
    throw new AppError(
      'Password must include uppercase, lowercase, number and symbol',
      400
    );
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
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
    email: normalizedEmail,
    password: hashedPassword,
    avatar: avatarData,
    verificationToken,
    verificationTokenExpiresAt,
  });

  await sendVerificationEmail(normalizedEmail, verificationToken);

  res.status(201).json({
    status: 'success',
    message: 'User created successfully. Check your email for verification.',
    user: serializeUser(user),
  });
});
/* ===============================
   VERIFY ACCOUNT
================================= */
export const verifyAccount = asyncHandler(async (req, res) => {
  const { verificationToken } = req.body;

  const user = await User.findOne({ verificationToken }).select(
    '+verificationToken +verificationTokenExpiresAt'
  );

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
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+password +tokenVersion'
  );

  if (!user) {
    throw new AppError('Invalid email or password', 400);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError('Invalid email or password', 400);
  }

  if (!user.isVerified) {
    throw new AppError('Verify your account before login', 403);
  }

  const session = await buildAuthenticatedSession(res, user);

  res.status(200).json({
    status: 'success',
    message: 'Login successful',
    user: session.user,
    accessToken: session.accessToken,
  });
});

/* ===============================
   LOGOUT
================================= */
export const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await User.findOneAndUpdate(
      { refreshTokenHash: tokenHash },
      {
        $set: {
          refreshTokenHash: '',
          refreshTokenExpiresAt: null,
        },
        $inc: { tokenVersion: 1 },
      }
    );
  }

  clearAuthCookies(res);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

/* ===============================
   REFRESH TOKEN
================================= */
export const refreshAuthToken = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 401);
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  if (decoded.type !== 'refresh') {
    throw new AppError('Invalid token type', 401);
  }

  const tokenHash = hashToken(refreshToken);

  const user = await User.findById(decoded.userId).select(
    '+refreshTokenHash +refreshTokenExpiresAt +tokenVersion'
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isVerified) {
    throw new AppError('Verify your account before login', 403);
  }

  if (
    decoded.tokenVersion !== user.tokenVersion ||
    !user.refreshTokenHash ||
    user.refreshTokenHash !== tokenHash ||
    !user.refreshTokenExpiresAt ||
    user.refreshTokenExpiresAt < Date.now()
  ) {
    throw new AppError('Refresh token expired or revoked', 401);
  }

  const { accessToken } = await issueAuthTokens(res, user);

  res.status(200).json({
    status: 'success',
    message: 'Session refreshed successfully',
    accessToken,
  });
});

/* ===============================
   SESSION STATUS
================================= */
export const getSessionStatus = asyncHandler(async (req, res) => {
  const accessToken = getAccessTokenFromRequest(req);
  const clearUnauthenticatedSession = () => {
    clearAuthCookies(res);
    return res.status(200).json({
      status: 'success',
      authenticated: false,
      user: null,
      accessToken: null,
    });
  };

  const accessTokenFromSession = async (token) => {
    const decoded = verifyAccessToken(token);

    if (decoded.type !== 'access') {
      return null;
    }

    const user = await User.findById(decoded.userId).select('+tokenVersion');

    if (!user || decoded.tokenVersion !== user.tokenVersion || !user.isVerified) {
      return null;
    }

    return {
      authenticated: true,
      accessToken: token,
      user: serializeUser(user),
    };
  };

  const refreshSession = async () => {
    const refreshToken = getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      return null;
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (decoded.type !== 'refresh') {
      return null;
    }

    const tokenHash = hashToken(refreshToken);
    const user = await User.findById(decoded.userId).select(
      '+refreshTokenHash +refreshTokenExpiresAt +tokenVersion'
    );

    if (
      !user ||
      !user.isVerified ||
      decoded.tokenVersion !== user.tokenVersion ||
      !user.refreshTokenHash ||
      user.refreshTokenHash !== tokenHash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt < Date.now()
    ) {
      return null;
    }

    return buildAuthenticatedSession(res, user);
  };

  if (!accessToken) {
    try {
      const refreshedSession = await refreshSession();

      if (refreshedSession) {
        return res.status(200).json({
          status: 'success',
          ...refreshedSession,
        });
      }
    } catch {
      return clearUnauthenticatedSession();
    }

    return clearUnauthenticatedSession();
  }

  try {
    const activeSession = await accessTokenFromSession(accessToken);

    if (activeSession) {
      return res.status(200).json({
        status: 'success',
        ...activeSession,
      });
    }

    const refreshedSession = await refreshSession();

    if (refreshedSession) {
      return res.status(200).json({
        status: 'success',
        ...refreshedSession,
      });
    }

    return clearUnauthenticatedSession();
  } catch {
    try {
      const refreshedSession = await refreshSession();

      if (refreshedSession) {
        return res.status(200).json({
          status: 'success',
          ...refreshedSession,
        });
      }
    } catch {
      return clearUnauthenticatedSession();
    }

    return clearUnauthenticatedSession();
  }
});

/* ======/* ===============================
   SEND RESET TOKEN
================================= */
export const resetPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!email) {
    throw new AppError('Email is required', 400);
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new AppError('User does not exist', 404);
  }

  const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiresAt = Date.now() + 60 * 60 * 1000;

  await user.save();

  await sendResetEmail(normalizedEmail, resetToken);

  res.status(200).json({
    status: 'success',
    message: 'Reset password token sent to email',
    userId: user._id,
  });
});

/*=========================
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

  const user = await User.findById(userId).select(
    '+tokenVersion +resetPasswordToken +resetPasswordExpiresAt'
  );

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
  user.refreshTokenHash = '';
  user.refreshTokenExpiresAt = null;
  user.tokenVersion += 1;

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
    user: serializeUser(user),
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
    users: users.map(serializeUser),
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
    user: serializeUser(user),
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
   GET MY PROFILE
================================= */
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').lean();

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    status: 'success',
    user: serializeUser(user),
  });
});

/* ===============================
   UPDATE MY PROFILE
================================= */
export const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (email) {
    if (!validator.isEmail(email)) {
      throw new AppError('Invalid email format', 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
      throw new AppError('Email already taken', 400);
    }

    user.email = email;
  }

  if (name) {
    user.name = name;
  }

  if (req.file) {
    if (user.avatar?.public_id && user.avatar.public_id !== 'default_id') {
      await deleteFromCloudinary(user.avatar.public_id);
    }

    const uploadedImage = await uploadsToCloudinary(
      req.file.buffer,
      'user_avatars'
    );

    user.avatar = {
      public_id: uploadedImage.public_id,
      url: uploadedImage.secure_url,
    };
  }

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    user: serializeUser(user),
  });
});

/* ===============================
   ADDRESS BOOK
================================= */
export const addAddress = asyncHandler(async (req, res) => {
  const { label, country, state, city, address, pinCode, phoneNo } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  user.addresses.push({
    label: label || '',
    country,
    state,
    city,
    address,
    pinCode,
    phoneNo,
  });

  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    status: 'success',
    message: 'Address added',
    addresses: user.addresses,
  });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);
  const address = user.addresses.id(id);
  if (!address) throw new AppError('Address not found', 404);

  Object.assign(address, updates);
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Address updated',
    addresses: user.addresses,
  });
});

export const removeAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);
  const address = user.addresses.id(id);
  if (!address) throw new AppError('Address not found', 404);

  address.deleteOne();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Address removed',
    addresses: user.addresses,
  });
});

/* ===============================
   WISHLIST
================================= */
export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw new AppError('productId is required', 400);
  const product = await Product.findById(productId).select('_id');
  if (!product) throw new AppError('Product not found', 404);
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const cleanedWishlist = Array.isArray(user.wishlist)
    ? user.wishlist.filter(Boolean)
    : [];
  user.wishlist = cleanedWishlist;

  const exists = user.wishlist.find(
    (id) => String(id) === String(productId)
  );

  if (exists) {
    user.wishlist = user.wishlist.filter(
      (id) => String(id) !== String(productId)
    );
  } else {
    user.wishlist.push(productId);
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(req.user._id)
    .populate('wishlist', 'name price image rating category')
    .lean();

  res.status(200).json({
    status: 'success',
    message: exists ? 'Removed from wishlist' : 'Added to wishlist',
    wishlist: (updatedUser?.wishlist || []).filter(Boolean),
  });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'name price image rating category')
    .lean();
  if (!user) throw new AppError('User not found', 404);
  res.status(200).json({
    status: 'success',
    wishlist: (user.wishlist || []).filter(Boolean),
  });
});

export const trackRecentlyViewed = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId).select('_id');

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found', 404);

  const filtered = (user.recentlyViewed || []).filter(
    (entry) => entry.product.toString() !== String(productId)
  );

  user.recentlyViewed = [
    { product: product._id, viewedAt: new Date() },
    ...filtered,
  ].slice(0, 20);

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Recently viewed list updated',
  });
});

export const getRecentlyViewed = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('recentlyViewed.product', 'name price image rating category')
    .lean();

  if (!user) throw new AppError('User not found', 404);

  const recentlyViewed = (user.recentlyViewed || [])
    .filter((entry) => entry.product)
    .map((entry) => ({
      ...entry.product,
      viewedAt: entry.viewedAt,
    }));

  res.status(200).json({
    status: 'success',
    recentlyViewed,
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

  const user = await User.findById(req.user._id).select(
    '+password +tokenVersion'
  );

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
  user.refreshTokenHash = '';
  user.refreshTokenExpiresAt = null;
  user.tokenVersion += 1;

  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
  });
});
