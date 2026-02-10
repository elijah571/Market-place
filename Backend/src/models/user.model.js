import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please enter your name'],
      maxLength: [
        25,
        'Invalid name, Please name should not exceed 24 characterd',
      ],
      minLength: [3, 'Name should contain more than 3 characters'],
    },

    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      validator: [validator.isEmail, 'Please enter valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please enter your name'],

      minLength: [8, 'password should contain more than 8 characters'],
      select: false,
    },
    avatar: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    resetPasswordToken: { type: String },
    resetPasswordTokenExipire: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  this.password = await bcrypt.hash(this.password, 10);
  if (!this.isModified('password')) {
    return next();
  }
});

userSchema.methods.getJWTTOKEN = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};
export const User = mongoose.model('User', userSchema);
