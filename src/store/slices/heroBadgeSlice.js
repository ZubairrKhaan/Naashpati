import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchHeroBadges = createAsyncThunk(
  "heroBadges/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/hero-badges");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch hero badges",
      );
    }
  },
);

export const updateHeroBadges = createAsyncThunk(
  "heroBadges/update",
  async (images, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.put(
        "/hero-badges",
        { images },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } },
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update hero badges",
      );
    }
  },
);

const heroBadgeSlice = createSlice({
  name: "heroBadges",
  initialState: {
    images: [],
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHeroBadges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHeroBadges.fulfilled, (state, action) => {
        state.images = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchHeroBadges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateHeroBadges.fulfilled, (state, action) => {
        state.images = action.payload;
      });
  },
});

export const selectHeroBadges = (state) => state.heroBadges.images;

export default heroBadgeSlice.reducer;
