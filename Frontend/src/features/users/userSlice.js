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
// Slice
// ---------------------

const initialState = {
  user: null,
  loading: false,
  error: null,
  success: false,
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
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.success = false;
      state.error = null;
      localStorage.removeItem('token'); // optional if using token
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

        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
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
  },
});

export const { removeErrors, removeSuccess, logout } = userSlice.actions;
export default userSlice.reducer;
