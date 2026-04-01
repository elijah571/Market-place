import { createSlice } from '@reduxjs/toolkit';

const CART_STORAGE_KEY = 'cartItems';
const SHIPPING_STORAGE_KEY = 'shippingInfo';

const getStoredData = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const persistCart = (state) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(state.shippingInfo));
};

const getItemKey = (item) =>
  `${item.productId}_${item.variantId || ''}_${item.selectedColor || ''}_${item.selectedSize || ''}`;

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
  lastError: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
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

      persistCart(state);
      state.lastError = null;
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => getItemKey(item) !== action.payload);
      persistCart(state);
    },
    updateCartQuantity: (state, action) => {
      const { cartKey, quantity } = action.payload;
      const item = state.items.find((entry) => getItemKey(entry) === cartKey);
      if (item) {
        item.quantity = quantity;
      }
      persistCart(state);
    },
    saveShippingInfo: (state, action) => {
      state.shippingInfo = action.payload;
      persistCart(state);
    },
    clearCart: (state) => {
      state.items = [];
      persistCart(state);
    },
    setCartError: (state, action) => {
      state.lastError = action.payload || null;
    },
  },
});

export const cartSelectors = {
  getItemKey,
  getSubtotal: (state) =>
    state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getShippingFee: (state) =>
    state.cart.items.reduce((sum, item) => sum + item.quantity, 0) > 0 ? 8 : 0,
  getTaxFee: (state) => {
    const subtotal = state.cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    return Number((subtotal * 0.075).toFixed(2));
  },
};

export const {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  saveShippingInfo,
  clearCart,
  setCartError,
} = cartSlice.actions;

export default cartSlice.reducer;
