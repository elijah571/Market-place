import { User } from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import { sendResetEmail, sendVerificationEmail } from '../utils/sendMail.js';
import { generateToken } from '../utils/token.js';

export const signUp = async (req, res) => {
  const { email, name, password } = req.body;
  try {
    if (!email || !name || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (
      !validator.isStrongPassword(password, {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        message:
          'Password must be at least 6 characters long and include at least one lowercase letter, one uppercase letter, one number, and one special character.',
      });
    }

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res
        .status(400)
        .json({ message: 'Email already exists, register with another email' });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationExpires = Date.now() + 1 * 60 * 60 * 1000;

    const user = new User({
      name,
      email,
      password: hashPassword,
      avatar: {
        public_id: 'public_id',
        url: 'url',
      },
      verificationToken,
      verificationTokenExpiresAt: verificationExpires,
    });

    await user.save();

    // Send only the verification token via email
    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json({
      message:
        'User successfully created. Check your email for the verification token.',
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
//verify account
export const verifyAccount = async (req, res) => {
  const { verificationToken } = req.body;

  try {
    // Find user with the provided token
    const user = await User.findOne({ verificationToken });

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Invalid or expired verification token' });
    }

    // Check if token has expired
    if (user.verificationTokenExpiresAt < Date.now()) {
      return res.status(400).json({
        message: 'Verification token has expired. Request a new one.',
      });
    }

    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = '';
    user.verificationTokenExpiresAt = null;
    await user.save();

    return res.status(200).json({ message: 'Account verified successfully' });
  } catch (error) {
    console.error('Error verifying account:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
//Login

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email not found' });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Generate and set token
    generateToken(res, user._id);

    // Send user details (excluding password)
    return res.status(200).json({
      message: 'Login successful',
      user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
//Log out
export const logoutUser = async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  return res.status(200).json({ message: 'Logged out successfully' });
};
// reset password verification code
export const resetPasswordToken = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User does not exist' });
    }

    // Generate a new reset password token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;
    // Update user with reset token and expiration
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    // Save the user with the new token
    await user.save();

    // Send reset password email
    await sendResetEmail(email, resetToken);

    return res
      .status(200)
      .json({ message: 'Reset password token sent to email' });
  } catch (error) {
    console.error('Error sending reset password token:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { userId } = req.params;
  const { resetToken, newPassword } = req.body;

  try {
    // Check if the userId, resetToken, and newPassword are provided
    if (!userId || !resetToken || !newPassword) {
      return res.status(400).json({
        message: 'User ID, reset token, and new password are required',
      });
    }

    // Find the user by their ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Log the reset token and the token stored in the database for debugging
    console.log('Reset Token Provided:', resetToken);
    console.log('Stored Token in DB:', user.resetPasswordToken);

    // Check if the reset token matches the one stored in the user record
    if (user.resetPasswordToken !== resetToken) {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Check if the reset token has expired
    if (user.resetPasswordExpiresAt < Date.now()) {
      return res
        .status(400)
        .json({ message: 'Reset token has expired. Request a new one' });
    }

    // Validate the new password strength
    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 6,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      return res.status(400).json({
        message:
          'New password must be at least 6 characters long and include at least one lowercase letter, one uppercase letter, one number, and one special character.',
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user with new password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = ''; // Clear the reset token
    user.resetPasswordExpiresAt = null; // Clear the expiration time
    await user.save();

    return res
      .status(200)
      .json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

//Update User profile

export const updateProfile = async (req, res) => {
  const { name, email, role } = req.body;
  const { userId } = req.params;

  try {
    // Check if the user making the request is an admin (Only admins can update roles)
    if (role && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only admins can update roles' });
    }

    if (role) {
      // Validate the provided role
      const validRoles = ['Admin', 'Shipper', 'Carrier', 'user'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role provided' });
      }
    }

    // Find the user by userId in the URL parameters
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user details only if provided
    if (name) {
      user.name = name;
    }

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res
          .status(400)
          .json({ message: 'Email is already taken by another user' });
      }
      user.email = email;
    }

    if (role) {
      user.role = role;
    }

    // Save the updated user
    await user.save();

    return res
      .status(200)
      .json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
// Get all user
export const getAllUsers = async (req, res) => {
  try {
    const user = await User.find({});
    if (!user) {
      return res(400).json({ message: 'Users not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
// Get user by Id
export const getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not Found' });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// Delete user by Id
export const deleteUserbyId = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);

    // If user doesn't exist, return a 404 response
    if (!user) {
      return res.status(404).json({ message: 'User not Found' });
    }

    // Delete the user
    await user.deleteOne();

    // Return a success response
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};
