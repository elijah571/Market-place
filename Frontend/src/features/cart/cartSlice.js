import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';
import { persistCartState, readPersistedCartState } from './cartPersistence';
import {
  getCartItemKey,
  mapServerCartItem,
  mergeCartItemLists,
  normalizePromoState,
  normalizeShippingInfo,
  sanitizeCartItems,
  toServerPayload,
} from './cartUtils';

const persistCart = (state) =>
  persistCartState({
    items: state.items,
    shippingInfo: state.shippingInfo,
    promo: state.promo,
    ownerId: state.ownerId,
  });

const applyServerCart = (state, payload) => {
  const cart = payload?.cart || {};

  state.cartId = cart._id || null;
  state.items = (cart.items || []).map(mapServerCartItem).filter(Boolean);
  state.shippingInfo = normalizeShippingInfo(cart.shippingInfo || state.shippingInfo);
  state.promo = cart.summary?.promoCode
    ? {
        code: cart.summary.promoCode,
        discountAmount: Number(cart.summary.discountPrice || 0),
      }
    : null;
  state.serverSummary = cart.summary || null;
  state.issues = cart.issues || [];
  state.ownerId = payload?.ownerId || null;
  state.lastSyncedAt = new Date().toISOString();
  state.lastError = null;
  persistCart(state);
};

const getAuthContext = (getState) => {
  const state = getState();
  return {
    userId: state.user.user?._id || null,
    cartState: state.cart,
  };
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userId } = getAuthContext(getState);
      const { data } = await apiClient.get('/cart/me');
      return { cart: data.data, ownerId: userId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to load cart');
    }
  }
);

export const syncCartWithServer = createAsyncThunk(
  'cart/syncCartWithServer',
  async (payload = {}, { getState, rejectWithValue }) => {
    try {
      const { userId, cartState } = getAuthContext(getState);
      const body = {
        ...toServerPayload(cartState),
        ...payload,
      };

      const { data } = await apiClient.put('/cart/me', body);
      return { cart: data.data, ownerId: userId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to sync cart');
    }
  }
);

export const mergeGuestCart = createAsyncThunk(
  'cart/mergeGuestCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { userId, cartState } = getAuthContext(getState);
      const alreadyOwnedByUser = Boolean(userId && cartState.ownerId === userId);
      const hasGuestData =
        cartState.items.length > 0 ||
        Boolean(cartState.promo?.code) ||
        Object.values(cartState.shippingInfo || {}).some(Boolean);

      if (alreadyOwnedByUser || !hasGuestData) {
        const { data } = await apiClient.get('/cart/me');
        return { cart: data.data, ownerId: userId };
      }

      const { data } = await apiClient.post('/cart/me/merge', toServerPayload(cartState));
      return { cart: data.data, ownerId: userId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to merge cart');
    }
  }
);

const initialState = {
  ...readPersistedCartState(),
  cartId: null,
  serverSummary: null,
  issues: [],
  syncing: false,
  lastSyncedAt: null,
  lastError: null,
};

const markGuestOwned = (state) => {
  state.ownerId = null;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateCartFromStorage: (state) => {
      const storedState = readPersistedCartState();
      state.items = storedState.items;
      state.shippingInfo = storedState.shippingInfo;
      state.promo = storedState.promo;
      state.ownerId = storedState.ownerId;
      state.cartId = null;
      state.serverSummary = null;
      state.issues = [];
      state.lastSyncedAt = null;
      state.lastError = null;
    },
    addToCart: (state, action) => {
      state.items = mergeCartItemLists(state.items, [action.payload]);

      state.serverSummary = null;
      state.issues = [];
      state.lastError = null;
      markGuestOwned(state);
      persistCart(state);
    },
    removeFromCart: (state, action) => {
      state.items = sanitizeCartItems(state.items).filter(
        (item) => getCartItemKey(item) !== action.payload
      );
      state.serverSummary = null;
      state.issues = [];
      markGuestOwned(state);
      persistCart(state);
    },
    updateCartQuantity: (state, action) => {
      const { cartKey, quantity } = action.payload;
      state.items = sanitizeCartItems(
        state.items.map((entry) =>
          getCartItemKey(entry) === cartKey
            ? { ...entry, quantity }
            : entry
        )
      );
      state.serverSummary = null;
      state.issues = [];
      markGuestOwned(state);
      persistCart(state);
    },
    saveShippingInfo: (state, action) => {
      state.shippingInfo = normalizeShippingInfo(action.payload);
      state.serverSummary = null;
      state.issues = [];
      markGuestOwned(state);
      persistCart(state);
    },
    clearCart: (state) => {
      state.items = [];
      state.promo = null;
      state.serverSummary = null;
      state.issues = [];
      state.cartId = null;
      markGuestOwned(state);
      persistCart(state);
    },
    setCartError: (state, action) => {
      state.lastError = action.payload || null;
    },
    applyPromo: (state, action) => {
      state.promo = normalizePromoState(action.payload);
      state.serverSummary = null;
      markGuestOwned(state);
      persistCart(state);
    },
    clearPromo: (state) => {
      state.promo = null;
      state.serverSummary = null;
      markGuestOwned(state);
      persistCart(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.syncing = true;
        state.lastError = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.syncing = false;
        applyServerCart(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.syncing = false;
        state.lastError = action.payload;
      })
      .addCase(syncCartWithServer.pending, (state) => {
        state.syncing = true;
        state.lastError = null;
      })
      .addCase(syncCartWithServer.fulfilled, (state, action) => {
        state.syncing = false;
        applyServerCart(state, action.payload);
      })
      .addCase(syncCartWithServer.rejected, (state, action) => {
        state.syncing = false;
        state.lastError = action.payload;
      })
      .addCase(mergeGuestCart.pending, (state) => {
        state.syncing = true;
        state.lastError = null;
      })
      .addCase(mergeGuestCart.fulfilled, (state, action) => {
        state.syncing = false;
        applyServerCart(state, action.payload);
      })
      .addCase(mergeGuestCart.rejected, (state, action) => {
        state.syncing = false;
        state.lastError = action.payload;
      });
  },
});

const getFallbackSubtotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const cartSelectors = {
  getItemKey: getCartItemKey,
  getItemCount: (state) =>
    state.cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
  getDistinctItemCount: (state) => state.cart.items.length,
  getSubtotal: (state) =>
    Number(state.cart.serverSummary?.itemPrice ?? getFallbackSubtotal(state)),
  getShippingFee: (state) =>
    Number(
      state.cart.serverSummary?.shippingPrice ??
        (state.cart.items.reduce((sum, item) => sum + item.quantity, 0) > 0 ? 8 : 0)
    ),
  getTaxFee: (state) =>
    Number(
      state.cart.serverSummary?.taxPrice ??
        Number((getFallbackSubtotal(state) * 0.075).toFixed(2))
    ),
  getDiscountFee: (state) =>
    Number(
      state.cart.serverSummary?.discountPrice ?? state.cart.promo?.discountAmount ?? 0
    ),
  hasBlockingIssues: (state) =>
    (state.cart.issues || []).some((issue) =>
      ['product_removed', 'variant_required', 'out_of_stock'].includes(issue?.code)
    ),
  getTotal: (state) => {
    if (state.cart.serverSummary) {
      return Number(state.cart.serverSummary.totalPrice || 0);
    }

    const subtotal = getFallbackSubtotal(state);
    const shipping =
      state.cart.items.reduce((sum, item) => sum + item.quantity, 0) > 0 ? 8 : 0;
    const tax = Number((subtotal * 0.075).toFixed(2));
    const discount = Number(state.cart.promo?.discountAmount || 0);

    return Number((subtotal + shipping + tax - discount).toFixed(2));
  },
  getMiniCartItems: (state) => state.cart.items.slice(0, 4),
};

export const {
  hydrateCartFromStorage,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  saveShippingInfo,
  clearCart,
  setCartError,
  applyPromo,
  clearPromo,
} = cartSlice.actions;

export default cartSlice.reducer;
