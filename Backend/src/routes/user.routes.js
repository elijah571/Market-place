import express from 'express';
import {
  changePassword,
  deleteUserById,
  getAllUsers,
  getUserById,
  loginUser,
  logoutUser,
  resetPassword,
  resetPasswordToken,
  signUp,
  updateProfile,
  verifyAccount,
} from '../controllers/user.controller.js';
import { isAdmin, isAuthenticated } from '../middleware/authentification.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();
//register user
router.post('/signup', upload.single('avatar'), signUp);
//VERIFY ACCOUNT
router.post('/verify-account', verifyAccount);
//Login Account
router.post('/login', loginUser);
//Logout user
router.post('/logout', logoutUser);
//reset password token request
router.post('/resetToken', isAuthenticated, resetPasswordToken);
//reset Password
router.put('/reset-password/:userId', isAuthenticated, resetPassword);

router.put('/change-password', isAuthenticated, changePassword);
// Route to update a user's profile and assign a role (only accessible to admin)

router.put('/update/profile/:userId', isAuthenticated, isAdmin, updateProfile);
//Get All users
router.get('/', isAuthenticated, isAdmin, getAllUsers);
//Get user by id
router.get('/:userId', isAuthenticated, isAdmin, getUserById);
//Delete user
router.delete('/delete/:userId', isAuthenticated, isAdmin, deleteUserById);

export default router;
