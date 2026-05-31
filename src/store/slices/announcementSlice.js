import {
  createSlice,
  createAsyncThunk,
  createSelector,
} from "@reduxjs/toolkit";
import api from "../../api/axios";

// Fetch active announcements (public)
export const fetchAnnouncements = createAsyncThunk(
  "announcements/fetchActive",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/announcements");
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch announcements",
      );
    }
  },
);

// Fetch all announcements (admin)
export const fetchAllAnnouncements = createAsyncThunk(
  "announcements/fetchAll",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.get("/announcements/all", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch announcements",
      );
    }
  },
);

// Create announcement (admin)
export const createAnnouncement = createAsyncThunk(
  "announcements/create",
  async (announcementData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.post("/announcements", announcementData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create announcement",
      );
    }
  },
);

// Update announcement (admin)
export const updateAnnouncement = createAsyncThunk(
  "announcements/update",
  async ({ id, data }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.put(`/announcements/${id}`, data, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update announcement",
      );
    }
  },
);

// Delete announcement (admin)
export const deleteAnnouncement = createAsyncThunk(
  "announcements/delete",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await api.delete(`/announcements/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete announcement",
      );
    }
  },
);

const announcementSlice = createSlice({
  name: "announcements",
  initialState: {
    active: [],
    all: [],
    isLoading: false,
    error: null,
    dismissed: [],
  },
  reducers: {
    dismissAnnouncement(state, action) {
      if (!state.dismissed.includes(action.payload)) {
        state.dismissed.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.active = action.payload;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchAllAnnouncements.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAllAnnouncements.fulfilled, (state, action) => {
        state.isLoading = false;
        state.all = action.payload;
      })
      .addCase(fetchAllAnnouncements.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.all.unshift(action.payload);
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        const idx = state.all.findIndex((a) => a._id === action.payload._id);
        if (idx !== -1) state.all[idx] = action.payload;
      })
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.all = state.all.filter((a) => a._id !== action.payload);
      });
  },
});

export const { dismissAnnouncement } = announcementSlice.actions;

export const selectActiveAnnouncements = createSelector(
  [
    (state) => state.announcements.active,
    (state) => state.announcements.dismissed,
  ],
  (active, dismissed) => active.filter((a) => !dismissed.includes(a._id)),
);
export const selectAllAnnouncements = (state) => state.announcements.all;
export const selectAnnouncementsLoading = (state) =>
  state.announcements.isLoading;

export default announcementSlice.reducer;
