import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';

// All products
export const getProduct = createAsyncThunk(
  'product/getProduct',
  async (
    { keyword, page = 1, category, priceLte, ratingGte, sort },
    { rejectWithValue }
  ) => {
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));

      if (category) {
        params.set('category', category);
      }

      if (keyword) {
        params.set('keyword', keyword);
      }

      if (priceLte !== undefined && priceLte !== null) {
        params.set('price[lte]', String(priceLte));
      }

      if (ratingGte !== undefined && ratingGte !== null) {
        params.set('rating[gte]', String(ratingGte));
      }

      if (sort) {
        params.set('sort', sort);
      }

      const { data } = await apiClient.get(`/products?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'An error occurred');
    }
  }
);
//Product Details

export const getProductDetails = createAsyncThunk(
  'product/getProductDetails',
  async (id, { rejectWithValue }) => {
    try {
      const link = `/product/${id}`;
      const { data } = await apiClient.get(link);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'An error occurred');
    }
  }
);

const productSlice = createSlice({
  name: 'product',
  initialState: {
    products: [],
    productCount: 0,
    loading: false,
    error: null,
    product: null,
    resultPerPage: 4,
    totalPage: 0,
  },

  reducers: {
    removeErrors: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.products = action.payload.data;
        state.productCount = action.payload.meta?.productCount || 0;
        state.resultPerPage = action.payload.meta?.resultPerPage || 4;
        state.totalPage = action.payload.meta?.totalPage || 0;
      })
      .addCase(getProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
        state.products = [];
      });
    builder
      .addCase(getProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.product = action.payload.data;
      })
      .addCase(getProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export const { removeErrors } = productSlice.actions;
export default productSlice.reducer;
