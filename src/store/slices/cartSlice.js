import { createSlice } from "@reduxjs/toolkit";

// Get user-scoped cart key from current access token
const getUserCartKey = () => {
  try {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const parsed = JSON.parse(token);
      // Use first 20 chars of token as unique session identifier
      return `cart_${parsed.substring(0, 20)}`;
    }
  } catch (e) {
    // fallback if token parsing fails
  }
  return "cart_anonymous";
};

// Get cart from localStorage
const getCartFromStorage = () => {
  const key = getUserCartKey();
  const cart = localStorage.getItem(key);
  return cart ? JSON.parse(cart) : { items: [], total: 0 };
};

// Save cart to localStorage
const saveCartToStorage = (cart) => {
  const key = getUserCartKey();
  localStorage.setItem(key, JSON.stringify(cart));
};
// Initial state
const initialState = {
  ...getCartFromStorage(),
  isLoading: false,
  error: null,
};

// Cart slice
const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(
        (item) => item.product._id === product._id,
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          product,
          quantity,
          price: product.price,
        });
      }

      // Recalculate total
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      saveCartToStorage(state);
    },
    removeFromCart: (state, action) => {
      const productId = action.payload;
      state.items = state.items.filter(
        (item) => item.product._id !== productId,
      );

      // Recalculate total
      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      saveCartToStorage(state);
    },
    updateQuantity: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((item) => item.product._id === productId);

      if (item && quantity > 0) {
        item.quantity = quantity;

        // Recalculate total
        state.total = state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );

        saveCartToStorage(state);
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      saveCartToStorage(state);
    },
    addItemsToCart: (state, action) => {
      const items = Array.isArray(action.payload) ? action.payload : [];

      items.forEach(({ product, quantity = 1, price }) => {
        if (!product?._id) {
          return;
        }

        const existingItem = state.items.find(
          (item) => item.product._id === product._id,
        );

        if (existingItem) {
          existingItem.quantity += quantity;
        } else {
          state.items.push({
            product,
            quantity,
            price: price ?? product.price,
          });
        }
      });

      state.total = state.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      saveCartToStorage(state);
    },
    resetCart: (state) => {
      // Clear cart completely when user logs out
      state.items = [];
      state.total = 0;
      // Clean up all user-scoped carts from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("cart_")) {
          localStorage.removeItem(key);
        }
      });
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addToCart,
  addItemsToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  resetCart,
  clearError,
} = cartSlice.actions;

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartItemCount = (state) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0);
export const selectCartIsLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;

export default cartSlice.reducer;
