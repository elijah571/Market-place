import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';
import { clearAccessToken, setAccessToken } from '../../utils/apiClient';

const normalizeWishlist = (wishlist = []) =>
  wishlist
    .map((entry) => (typeof entry === 'string' ? entry : entry?._id))
    .filter(Boolean);

export const register = createAsyncThunk(
  '/user/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/signup', userData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const login = createAsyncThunk(
  '/user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/login', {
        email,
        password,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const verifyAccount = createAsyncThunk(
  '/user/verifyAccount',
  async (verificationToken, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/verify-account', {
        verificationToken,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const sendResetToken = createAsyncThunk(
  '/user/sendResetToken',
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/resetToken', { email });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  '/user/resetPassword',
  async ({ userId, resetToken, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/users/reset-password/${userId}`, {
        resetToken,
        newPassword,
      });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const loadCurrentUser = createAsyncThunk(
  '/user/loadCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/users/session');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getWishlist = createAsyncThunk(
  '/user/getWishlist',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/users/me/wishlist');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  },
  {
    condition: (arg, { getState }) => {
      const state = getState().user;
      const force = Boolean(arg?.force);

      if (!state.isAuthenticated || state.wishlistLoading) {
        return false;
      }

      if (state.wishlistLoaded && !force) {
        return false;
      }

      return true;
    },
  }
);

export const toggleWishlist = createAsyncThunk(
  '/user/toggleWishlist',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/me/wishlist', { productId });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getRecentlyViewed = createAsyncThunk(
  '/user/getRecentlyViewed',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get('/users/me/recently-viewed');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const trackRecentlyViewed = createAsyncThunk(
  '/user/trackRecentlyViewed',
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/me/recently-viewed', { productId });
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addAddress = createAsyncThunk(
  '/user/addAddress',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/me/addresses', payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAddress = createAsyncThunk(
  '/user/updateAddress',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.put(`/users/me/addresses/${id}`, payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const removeAddress = createAsyncThunk(
  '/user/removeAddress',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.delete(`/users/me/addresses/${id}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const logoutUserApi = createAsyncThunk(
  '/user/logout',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/users/logout');
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  user: null,
  loading: false,
  authLoading: false,
  error: null,
  success: false,
  verifySuccess: false,
  resetTokenSent: false,
  resetPasswordSuccess: false,
  resetUserId: null,
  isAuthenticated: false,
  authChecked: false,
  wishlist: [],
  wishlistProducts: [],
  wishlistLoading: false,
  wishlistLoaded: false,
  recentlyViewed: [],
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
      state.authChecked = true;
      state.authLoading = false;
      state.success = false;
      state.error = null;
      clearAccessToken();
      state.wishlist = [];
      state.wishlistProducts = [];
      state.wishlistLoading = false;
      state.wishlistLoaded = false;
      state.recentlyViewed = [];
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.status === 'success';
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        state.authLoading = false;
        clearAccessToken();
        state.wishlist = [];
        state.wishlistProducts = [];
        state.wishlistLoading = false;
        state.wishlistLoaded = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed, please try again';
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        state.authLoading = false;
        state.success = false;
        state.wishlistLoading = false;
        state.wishlistLoaded = false;
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.success = action.payload.status === 'success';
        state.isAuthenticated = true;
        state.authChecked = true;
        state.authLoading = false;
        setAccessToken(action.payload.accessToken);
        state.wishlist = normalizeWishlist(action.payload.user?.wishlist);
        state.wishlistProducts = [];
        state.wishlistLoading = false;
        state.wishlistLoaded = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed, please try again';
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        state.authLoading = false;
        state.success = false;
        clearAccessToken();
        state.wishlistLoading = false;
        state.wishlistLoaded = false;
      })
      .addCase(loadCurrentUser.pending, (state) => {
        state.loading = true;
        state.authLoading = true;
      })
      .addCase(loadCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.authLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = Boolean(action.payload.authenticated);
        state.authChecked = true;
        if (action.payload.accessToken) {
          setAccessToken(action.payload.accessToken);
        } else if (!action.payload.authenticated) {
          clearAccessToken();
        }
        state.wishlist = normalizeWishlist(action.payload.user?.wishlist);
        state.wishlistProducts = [];
        state.wishlistLoading = false;
        state.wishlistLoaded = false;
        state.recentlyViewed = [];
      })
      .addCase(loadCurrentUser.rejected, (state) => {
        state.loading = false;
        state.authLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        state.wishlist = [];
        state.wishlistProducts = [];
        state.wishlistLoading = false;
        state.wishlistLoaded = false;
        state.recentlyViewed = [];
        clearAccessToken();
      })
      .addCase(logoutUserApi.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.authChecked = true;
        state.authLoading = false;
        state.success = false;
        state.error = null;
        clearAccessToken();
        state.wishlist = [];
        state.wishlistProducts = [];
        state.wishlistLoading = false;
        state.wishlistLoaded = false;
        state.recentlyViewed = [];
      })
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
      })
      .addCase(sendResetToken.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetTokenSent = false;
      })
      .addCase(sendResetToken.fulfilled, (state, action) => {
        state.loading = false;
        state.resetTokenSent = true;
        state.resetUserId = action.payload.userId;
      })
      .addCase(sendResetToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to send reset token';
        state.resetTokenSent = false;
      })
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
      })
      .addCase(getWishlist.pending, (state) => {
        state.wishlistLoading = true;
        state.error = null;
      })
      .addCase(getWishlist.fulfilled, (state, action) => {
        state.wishlistLoading = false;
        state.wishlistLoaded = true;
        state.wishlist = normalizeWishlist(action.payload.wishlist);
        state.wishlistProducts = (action.payload.wishlist || []).filter(Boolean);
      })
      .addCase(getWishlist.rejected, (state, action) => {
        state.wishlistLoading = false;
        state.error = action.payload || 'Unable to load saved products';
        state.wishlistProducts = [];
      })
      .addCase(toggleWishlist.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.wishlist = normalizeWishlist(action.payload.wishlist);
        state.wishlistProducts = (action.payload.wishlist || []).filter(Boolean);
        state.wishlistLoaded = true;
      })
      .addCase(toggleWishlist.rejected, (state, action) => {
        state.error = action.payload || 'Unable to update saved products';
      })
      .addCase(getRecentlyViewed.fulfilled, (state, action) => {
        state.recentlyViewed = action.payload.recentlyViewed || [];
      })
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.addresses = action.payload.addresses || [];
        }
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to save address';
      })
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.addresses = action.payload.addresses || [];
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to update address';
      })
      .addCase(removeAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeAddress.fulfilled, (state, action) => {
        state.loading = false;
        if (state.user) {
          state.user.addresses = action.payload.addresses || [];
        }
      })
      .addCase(removeAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to remove address';
      });
  },
});

export const { removeErrors, removeSuccess, logout } = userSlice.actions;
export default userSlice.reducer;
