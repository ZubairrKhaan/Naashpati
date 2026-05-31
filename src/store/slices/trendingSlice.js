import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

// Async thunk to fetch trending products
export const fetchTrendingProducts = createAsyncThunk(
  "trending/fetchTrendingProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/products/trending");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch trending products",
      );
    }
  },
);

// Initial state
const initialState = {
  products: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Slice
const trendingSlice = createSlice({
  name: "trending",
  initialState,
  reducers: {
    clearTrendingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrendingProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTrendingProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data || [];
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchTrendingProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch trending products";
      });
  },
});

// Selectors
export const selectTrendingProducts = (state) => state.trending.products;
export const selectTrendingIsLoading = (state) => state.trending.isLoading;
export const selectTrendingError = (state) => state.trending.error;
export const selectTrendingLastUpdated = (state) => state.trending.lastUpdated;

export const { clearTrendingError } = trendingSlice.actions;
export default trendingSlice.reducer;
