import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password too long');

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: passwordSchema,
});

export const verifyAccountSchema = z.object({
  verificationToken: z.string().min(4, 'Verification token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().min(4, 'Reset token is required'),
  newPassword: passwordSchema,
});

export const resetTokenRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
});
