import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const fetchSaleOffers = createAsyncThunk(
  "saleOffers/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/sale-offers`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch sale offers",
      );
    }
  },
);

export const fetchSaleOffer = createAsyncThunk(
  "saleOffers/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/sale-offers/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch sale offer",
      );
    }
  },
);

export const fetchAllSaleOffers = createAsyncThunk(
  "saleOffers/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/sale-offers/all`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch sale offers",
      );
    }
  },
);

export const createSaleOffer = createAsyncThunk(
  "saleOffers/create",
  async (offerData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(`${API_URL}/sale-offers`, offerData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create sale offer",
      );
    }
  },
);

export const deleteSaleOffer = createAsyncThunk(
  "saleOffers/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.delete(`${API_URL}/sale-offers/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete sale offer",
      );
    }
  },
);

const saleOfferSlice = createSlice({
  name: "saleOffers",
  initialState: {
    items: [],
    adminItems: [],
    current: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearSaleOffer: (state) => {
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSaleOffers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSaleOffers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchSaleOffers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchSaleOffer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.current = null;
      })
      .addCase(fetchSaleOffer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.current = action.payload;
      })
      .addCase(fetchSaleOffer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllSaleOffers.fulfilled, (state, action) => {
        state.adminItems = action.payload;
      })
      .addCase(createSaleOffer.fulfilled, (state, action) => {
        state.adminItems.unshift(action.payload);
        if (action.payload.isActive) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(deleteSaleOffer.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter(
          (offer) => offer._id !== action.payload,
        );
        state.items = state.items.filter((offer) => offer._id !== action.payload);
      });
  },
});

export const { clearSaleOffer } = saleOfferSlice.actions;
export const selectSaleOffers = (state) => state.saleOffers.items;
export const selectAllSaleOffers = (state) => state.saleOffers.adminItems;
export const selectCurrentSaleOffer = (state) => state.saleOffers.current;
export const selectSaleOfferStatus = (state) => state.saleOffers.isLoading;
export const selectSaleOfferError = (state) => state.saleOffers.error;

export default saleOfferSlice.reducer;
