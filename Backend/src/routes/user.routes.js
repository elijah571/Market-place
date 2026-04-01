import express from 'express';
import {
  changePassword,
  deleteUserById,
  getAllUsers,
  getMyProfile,
  getUserById,
  loginUser,
  logoutUser,
  refreshAuthToken,
  resetPassword,
  resetPasswordToken,
  signUp,
  updateMyProfile,
  updateProfile,
  verifyAccount,
  addAddress,
  updateAddress,
  removeAddress,
  toggleWishlist,
  getWishlist,
  getRecentlyViewed,
  trackRecentlyViewed,
} from '../controllers/user.controller.js';
import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import { upload } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  loginSchema,
  resetPasswordSchema,
  resetTokenRequestSchema,
  signUpSchema,
  verifyAccountSchema,
} from '../validation/auth.validation.js';
import {
  addressSchema,
  recentlyViewedSchema,
  updateAddressSchema,
  wishlistSchema,
} from '../validation/user.validation.js';

const router = express.Router();
//register user
router.post('/signup', upload.single('avatar'), validate(signUpSchema), signUp);
//VERIFY ACCOUNT
router.post('/verify-account', validate(verifyAccountSchema), verifyAccount);
//Login Account
router.post('/login', validate(loginSchema), loginUser);
//Logout user
router.post('/logout', logoutUser);
//Refresh access token
router.post('/refresh-token', refreshAuthToken);
//reset password token request
router.post('/resetToken', validate(resetTokenRequestSchema), resetPasswordToken);
//reset Password
router.put('/reset-password/:userId', validate(resetPasswordSchema), resetPassword);

router.get('/me', isAuthenticated, getMyProfile);
router.put('/me', isAuthenticated, upload.single('avatar'), updateMyProfile);
router.post('/me/addresses', isAuthenticated, validate(addressSchema), addAddress);
router.put('/me/addresses/:id', isAuthenticated, validate(updateAddressSchema), updateAddress);
router.delete('/me/addresses/:id', isAuthenticated, removeAddress);
router.get('/me/wishlist', isAuthenticated, getWishlist);
router.post('/me/wishlist', isAuthenticated, validate(wishlistSchema), toggleWishlist);
router.get('/me/recently-viewed', isAuthenticated, getRecentlyViewed);
router.post(
  '/me/recently-viewed',
  isAuthenticated,
  validate(recentlyViewedSchema),
  trackRecentlyViewed
);

router.put('/change-password', isAuthenticated, validate(changePasswordSchema), changePassword);
// Route to update a user's profile and assign a role (only accessible to admin)

router.put('/update/profile/:userId', isAuthenticated, isAdmin, updateProfile);
//Get All users
router.get('/', isAuthenticated, isAdmin, getAllUsers);
//Get user by id
router.get('/:userId', isAuthenticated, isAdmin, getUserById);
//Delete user
router.delete('/delete/:userId', isAuthenticated, isAdmin, deleteUserById);

export default router;
