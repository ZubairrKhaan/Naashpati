import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Initial state
const initialState = {
  orders: [],
  order: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

// Async thunks
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = auth.accessToken
        ? {
            headers: {
              Authorization: `Bearer ${auth.accessToken}`,
            },
          }
        : undefined;
      const response = await axios.post(`${API_URL}/orders`, orderData, config);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create order",
      );
    }
  },
);

export const getOrderById = createAsyncThunk(
  "orders/getOrderById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch order",
      );
    }
  },
);

export const getMyOrders = createAsyncThunk(
  "orders/getMyOrders",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/orders/myorders`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch orders",
      );
    }
  },
);

export const getOrders = createAsyncThunk(
  "orders/getOrders",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/orders?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch orders",
      );
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async ({ id, status }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(
        `${API_URL}/orders/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update order status",
      );
    }
  },
);

export const createPaymentIntent = createAsyncThunk(
  "orders/createPaymentIntent",
  async (amount, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `${API_URL}/orders/create-payment-intent`,
        { amount },
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create payment intent",
      );
    }
  },
);

export const confirmPayment = createAsyncThunk(
  "orders/confirmPayment",
  async ({ orderId, paymentIntentId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `${API_URL}/orders/confirm-payment`,
        { orderId, paymentIntentId },
        {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to confirm payment",
      );
    }
  },
);

// Order slice
const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOrder: (state) => {
      state.order = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.order = action.payload;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get order by ID
      .addCase(getOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.order = action.payload;
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get my orders
      .addCase(getMyOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(getMyOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get all orders (admin)
      .addCase(getOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update order status
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.orders.findIndex(
          (o) => o._id === action.payload._id,
        );
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.order && state.order._id === action.payload._id) {
          state.order = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create payment intent
      .addCase(createPaymentIntent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPaymentIntent.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(createPaymentIntent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Confirm payment
      .addCase(confirmPayment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.order) {
          state.order.isPaid = true;
          state.order.paidAt = new Date().toISOString();
        }
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearOrder } = orderSlice.actions;
export const selectOrders = (state) => state.orders.orders;
export const selectOrder = (state) => state.orders.order;
export const selectOrdersLoading = (state) => state.orders.isLoading;
export const selectOrdersError = (state) => state.orders.error;
export default orderSlice.reducer;
