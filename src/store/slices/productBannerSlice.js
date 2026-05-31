import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const fetchProductBanners = createAsyncThunk(
  "productBanners/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/product-banners`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch product banners",
      );
    }
  },
);

export const fetchAllProductBanners = createAsyncThunk(
  "productBanners/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/product-banners/all`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch product banners",
      );
    }
  },
);

export const createProductBanner = createAsyncThunk(
  "productBanners/create",
  async (bannerData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `${API_URL}/product-banners`,
        bannerData,
        {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        },
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create product banner",
      );
    }
  },
);

export const deleteProductBanner = createAsyncThunk(
  "productBanners/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.delete(`${API_URL}/product-banners/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete product banner",
      );
    }
  },
);

const productBannerSlice = createSlice({
  name: "productBanners",
  initialState: {
    items: [],
    adminItems: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductBanners.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProductBanners.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchProductBanners.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllProductBanners.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllProductBanners.fulfilled, (state, action) => {
        state.isLoading = false;
        state.adminItems = action.payload;
      })
      .addCase(fetchAllProductBanners.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createProductBanner.fulfilled, (state, action) => {
        state.adminItems.unshift(action.payload);
        if (action.payload.isActive) {
          state.items.push(action.payload);
        }
      })
      .addCase(deleteProductBanner.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter(
          (banner) => banner._id !== action.payload,
        );
        state.items = state.items.filter(
          (banner) => banner._id !== action.payload,
        );
      });
  },
});

export const selectProductBanners = (state) => state.productBanners.items;
export const selectAllProductBanners = (state) =>
  state.productBanners.adminItems;

export default productBannerSlice.reducer;

