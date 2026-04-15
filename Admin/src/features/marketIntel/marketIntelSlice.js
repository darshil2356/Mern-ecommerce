import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../utils/axiosconfig";

export const getMarketIntelLast = createAsyncThunk(
  "marketIntel/getLast",
  async (segment = "women", { rejectWithValue }) => {
    try {
      const response = await axios.get(`/marketIntel/last?segment=${segment}`, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch market intel");
    }
  }
);

export const generateMarketIntel = createAsyncThunk(
  "marketIntel/generate",
  async (segment = "women", { rejectWithValue }) => {
    try {
      const response = await axios.get(`/marketIntel/generate?segment=${segment}`, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem("user"))?.token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to generate market intel");
    }
  }
);

const initialState = {
  data: null,
  loading: false,
  lastLoading: false,
  error: null,
  segment: "women"
};

const marketIntelSlice = createSlice({
  name: "marketIntel",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSegment: (state, action) => {
      state.segment = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Last
      .addCase(getMarketIntelLast.pending, (state) => {
        state.lastLoading = true;
        state.error = null;
      })
      .addCase(getMarketIntelLast.fulfilled, (state, action) => {
        state.lastLoading = false;
        state.data = action.payload;
      })
      .addCase(getMarketIntelLast.rejected, (state, action) => {
        state.lastLoading = false;
        state.error = action.payload;
      })
      // Generate
      .addCase(generateMarketIntel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateMarketIntel.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(generateMarketIntel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setSegment } = marketIntelSlice.actions;
export default marketIntelSlice.reducer;

