import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';

export const initializePayment = createAsyncThunk(
  'payment/initialize',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/payments/initialize', payload);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Unable to initialize payment'
      );
    }
  }
);

export const verifyPayment = createAsyncThunk(
  'payment/verify',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post('/payments/verify', payload);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Payment verification failed');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    loading: false,
    error: null,
    transaction: null,
    paymentData: null,
    order: null,
  },
  reducers: {
    clearPaymentState: (state) => {
      state.error = null;
      state.loading = false;
      state.transaction = null;
      state.paymentData = null;
      state.order = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializePayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializePayment.fulfilled, (state, action) => {
        state.loading = false;
        state.transaction = action.payload.data?.transaction || null;
        state.paymentData = action.payload.data?.payment || null;
      })
      .addCase(initializePayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(verifyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.transaction = action.payload.data || null;
        state.order = action.payload.data?.order || null;
      })
      .addCase(verifyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;
export default paymentSlice.reducer;
