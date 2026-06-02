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

export const updateHeroGenderImages = createAsyncThunk(
  "heroBadges/updateGenderImages",
  async (genderImages, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.put(
        "/hero-badges/gender-images",
        { genderImages },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } },
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update gender images",
      );
    }
  },
);

const normalizeHeroBadgePayload = (payload) => {
  if (Array.isArray(payload)) {
    return { images: payload, genderImages: { female: "", male: "" } };
  }

  const images = Array.isArray(payload?.images) ? payload.images : [];
  const genderImages = payload?.genderImages || {};

  return {
    images,
    genderImages: {
      female:
        typeof genderImages.female === "string" ? genderImages.female : "",
      male: typeof genderImages.male === "string" ? genderImages.male : "",
    },
  };
};

const heroBadgeSlice = createSlice({
  name: "heroBadges",
  initialState: {
    images: [],
    genderImages: {
      female: "",
      male: "",
    },
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
        const normalized = normalizeHeroBadgePayload(action.payload);
        state.images = normalized.images;
        state.genderImages = normalized.genderImages;
        state.isLoading = false;
      })
      .addCase(fetchHeroBadges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(updateHeroBadges.fulfilled, (state, action) => {
        const normalized = normalizeHeroBadgePayload(action.payload);
        state.images = normalized.images;
        state.genderImages = normalized.genderImages;
      })
      .addCase(updateHeroGenderImages.fulfilled, (state, action) => {
        const normalized = normalizeHeroBadgePayload(action.payload);
        state.images = normalized.images;
        state.genderImages = normalized.genderImages;
      });
  },
});

export const selectHeroBadges = (state) => state.heroBadges.images;
export const selectHeroGenderImages = (state) => state.heroBadges.genderImages;

export default heroBadgeSlice.reducer;
