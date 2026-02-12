import express from 'express';
import {
  deleteUserbyId,
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
import { isAdmin, isAuthenticateUser } from '../middleware/authentification.js';

const router = express.Router();
//register user
router.post('/signup', signUp);
//VERIFY ACCOUNT
router.post('/verify-account', verifyAccount);
//Login Account
router.post('/login', loginUser);
//Logout user
router.post('/logout', logoutUser);
//reset password token request
router.post('/resetToken', isAuthenticateUser, resetPasswordToken);
//reset Password
router.put('/reset-password/:userId', isAuthenticateUser, resetPassword);
// Route to update a user's profile and assign a role (only accessible to admin)
router.put(
  '/update-user-role/:userId',
  isAuthenticateUser,
  isAdmin,
  updateProfile
);
//Get All users
router.get('/', isAuthenticateUser, isAdmin, getAllUsers);
//Get user by id
router.get('/:userId', isAuthenticateUser, isAdmin, getUserById);
//Delete user
router.delete('/delete/:userId', isAuthenticateUser, isAdmin, deleteUserbyId);

export default router;
