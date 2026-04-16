import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axiosconfig";

export const fetchTodayEntries = createAsyncThunk("rojmel/today", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/rojmel/today");
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchByDate = createAsyncThunk("rojmel/byDate", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/rojmel/by-date", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchSummary = createAsyncThunk("rojmel/summary", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/rojmel/summary", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const addRojmelEntry = createAsyncThunk("rojmel/add", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/rojmel/add", payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteRojmelEntry = createAsyncThunk("rojmel/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/rojmel/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const rojmelSlice = createSlice({
  name: "rojmel",
  initialState: {
    entries: [],
    summary: { openingBalance: 0, totalIncome: 0, totalExpense: 0, closingBalance: 0 },
    monthlySummary: null,
    pagination: { total: 0, page: 1, limit: 50, pages: 1 },
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchTodayEntries.pending, pending)
      .addCase(fetchTodayEntries.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.entries = payload.data;
        state.summary = payload.summary;
      })
      .addCase(fetchTodayEntries.rejected, rejected)

      .addCase(fetchByDate.pending, pending)
      .addCase(fetchByDate.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.entries = payload.data;
        state.summary = payload.summary;
        state.pagination = payload.pagination;
      })
      .addCase(fetchByDate.rejected, rejected)

      .addCase(fetchSummary.pending, pending)
      .addCase(fetchSummary.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.monthlySummary = payload;
      })
      .addCase(fetchSummary.rejected, rejected)

      .addCase(addRojmelEntry.pending, pending)
      .addCase(addRojmelEntry.fulfilled, (state) => { state.loading = false; })
      .addCase(addRojmelEntry.rejected, rejected)

      .addCase(deleteRojmelEntry.pending, pending)
      .addCase(deleteRojmelEntry.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.entries = state.entries.filter(e => e._id !== payload);
      })
      .addCase(deleteRojmelEntry.rejected, rejected);
  },
});

export const { clearError } = rojmelSlice.actions;
export default rojmelSlice.reducer;
