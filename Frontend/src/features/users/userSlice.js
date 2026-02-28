import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// ---------------------
// Async Thunks
// ---------------------

export const register = createAsyncThunk(
  '/user/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/v1/users/signup', userData);
      return data; // expecting { success: true, user: {...}, token? }
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

export const login = createAsyncThunk(
  '/user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post(
        '/api/v1/users/login', // ✅ corrected
        { email, password },
        config
      );
      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

// ---------------------
// Verify Account
// ---------------------
export const verifyAccount = createAsyncThunk(
  '/user/verifyAccount',
  async (verificationToken, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/v1/users/verify-account', {
        verificationToken,
      });

      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

// ---------------------
// Send Reset Password Token
// ---------------------
export const sendResetToken = createAsyncThunk(
  '/user/sendResetToken',
  async (email, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.post(
        '/api/v1/users/resetToken',
        { email },
        config
      );

      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

// ---------------------
// Reset Password
// ---------------------
export const resetPassword = createAsyncThunk(
  '/user/resetPassword',
  async ({ userId, resetToken, newPassword }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const { data } = await axios.put(
        `/api/v1/users/reset-password/${userId}`,
        { resetToken, newPassword },
        config
      );

      return data;
    } catch (error) {
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue(error.message);
    }
  }
);

// ---------------------
// Slice
// ---------------------

const initialState = {
  user: null,
  loading: false,
  error: null,
  success: false,
  verifySuccess: false,
  resetTokenSent: false,
  resetPasswordSuccess: false,
  resetUserId: null,
  isAuthenticated: false,
};
const userSlice = createSlice({
  name: 'user',
  initialState,

  reducers: {
    removeErrors: (state) => {
      state.error = null;
    },
    removeSuccess: (state) => {
      state.success = false;
      state.verifySuccess = false;
      state.resetTokenSent = false;
      state.resetPasswordSuccess = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.success = false;
      state.error = null;
      localStorage.removeItem('token');
    },
  },

  extraReducers: (builder) => {
    // --- Register ---
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.success = action.payload.success;
        state.isAuthenticated = true;
        if (action.payload.token)
          localStorage.setItem('token', action.payload.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed, please try again';
        state.user = null;
        state.isAuthenticated = false;
        state.success = false;
      });

    // --- Login ---
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.success = action.payload.success;
        state.isAuthenticated = true;

        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed, please try again';
        state.user = null;
        state.isAuthenticated = false;
        state.success = false;
      });
    // --- Verify Account ---
    builder
      .addCase(verifyAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.verifySuccess = false;
      })
      .addCase(verifyAccount.fulfilled, (state) => {
        state.loading = false;
        state.verifySuccess = true;
      })
      .addCase(verifyAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Verification failed';
        state.verifySuccess = false;
      });
    // --- Send Reset Token ---
    builder
      .addCase(sendResetToken.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetTokenSent = false;
      })
      .addCase(sendResetToken.fulfilled, (state, action) => {
        state.loading = false;
        state.resetTokenSent = true;
        state.resetUserId = action.payload.userId; // ✅ store userId
      })
      .addCase(sendResetToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send reset token';
        state.resetTokenSent = false;
      });

    // --- Reset Password ---
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetPasswordSuccess = false;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.resetPasswordSuccess = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Password reset failed';
        state.resetPasswordSuccess = false;
      });
  },
});

export const { removeErrors, removeSuccess, logout } = userSlice.actions;
export default userSlice.reducer;
