import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '../../utils/apiClient';

const CART_STORAGE_KEY = 'cartItems';
const SHIPPING_STORAGE_KEY = 'shippingInfo';
const PROMO_STORAGE_KEY = 'promoInfo';
const CART_OWNER_STORAGE_KEY = 'cartOwner';

const getStoredData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const getStoredOwner = () => {
  try {
    return localStorage.getItem(CART_OWNER_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

const persistCart = (state) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(state.shippingInfo));
  localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(state.promo));

  if (state.ownerId) {
    localStorage.setItem(CART_OWNER_STORAGE_KEY, state.ownerId);
    return;
  }

  localStorage.removeItem(CART_OWNER_STORAGE_KEY);
};

const getItemKey = (item) =>
  `${item.productId || item.product}_${item.variantId || ''}_${item.selectedColor || ''}_${item.selectedSize || ''}`;

const toServerPayload = (state) => ({
  items: state.items.map((item) => ({
    product: item.productId || item.product,
    quantity: item.quantity,
    selectedColor: item.selectedColor || '',
    selectedSize: item.selectedSize || '',
    variantId: item.variantId || null,
  })),
  shippingInfo: state.shippingInfo,
  promoCode: state.promo?.code || '',
});

const mapServerCartItem = (item) => ({
  ...item,
  productId: item.product,
  stock: item.availableStock,
});

const applyServerCart = (state, payload) => {
  const cart = payload?.cart || {};

  state.cartId = cart._id || null;
  state.items = (cart.items || []).map(mapServerCartItem);
  state.shippingInfo = cart.shippingInfo || state.shippingInfo;
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
  items: getStoredData(CART_STORAGE_KEY, []),
  shippingInfo: getStoredData(SHIPPING_STORAGE_KEY, {
    country: '',
    state: '',
    city: '',
    address: '',
    pinCode: '',
    phoneNo: '',
  }),
  promo: getStoredData(PROMO_STORAGE_KEY, null),
  cartId: null,
  ownerId: getStoredOwner(),
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
      state.items = getStoredData(CART_STORAGE_KEY, []);
      state.shippingInfo = getStoredData(SHIPPING_STORAGE_KEY, state.shippingInfo);
      state.promo = getStoredData(PROMO_STORAGE_KEY, null);
      state.ownerId = getStoredOwner();
    },
    addToCart: (state, action) => {
      const incoming = action.payload;
      const incomingKey = getItemKey(incoming);
      const existingIndex = state.items.findIndex(
        (item) => getItemKey(item) === incomingKey
      );

      if (existingIndex >= 0) {
        state.items[existingIndex].quantity += incoming.quantity;
      } else {
        state.items.push(incoming);
      }

      state.serverSummary = null;
      state.issues = [];
      state.lastError = null;
      markGuestOwned(state);
      persistCart(state);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => getItemKey(item) !== action.payload);
      state.serverSummary = null;
      state.issues = [];
      markGuestOwned(state);
      persistCart(state);
    },
    updateCartQuantity: (state, action) => {
      const { cartKey, quantity } = action.payload;
      const item = state.items.find((entry) => getItemKey(entry) === cartKey);
      if (item) {
        item.quantity = quantity;
      }
      state.serverSummary = null;
      state.issues = [];
      markGuestOwned(state);
      persistCart(state);
    },
    saveShippingInfo: (state, action) => {
      state.shippingInfo = action.payload;
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
      state.promo = action.payload || null;
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
  getItemKey,
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
