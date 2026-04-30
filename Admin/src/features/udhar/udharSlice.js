import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axiosconfig";

export const fetchAllUdhar = createAsyncThunk("udhar/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/udhar", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const addUdhar = createAsyncThunk("udhar/add", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/udhar/add", payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const recordUdharPayment = createAsyncThunk("udhar/pay", async ({ id, amount, note }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/udhar/${id}/pay`, { amount, note });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteUdhar = createAsyncThunk("udhar/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/udhar/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const udharSlice = createSlice({
  name: "udhar",
  initialState: {
    records: [],
    totalPending: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchAllUdhar.pending, pending)
      .addCase(fetchAllUdhar.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.records = payload.data;
        state.totalPending = payload.totalPending;
      })
      .addCase(fetchAllUdhar.rejected, rejected)

      .addCase(addUdhar.pending, pending)
      .addCase(addUdhar.fulfilled, (state) => { state.loading = false; })
      .addCase(addUdhar.rejected, rejected)

      .addCase(recordUdharPayment.pending, pending)
      .addCase(recordUdharPayment.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.records.findIndex(r => r._id === payload.data._id);
        if (idx !== -1) state.records[idx] = payload.data;
      })
      .addCase(recordUdharPayment.rejected, rejected)

      .addCase(deleteUdhar.pending, pending)
      .addCase(deleteUdhar.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.records = state.records.filter(r => r._id !== payload);
      })
      .addCase(deleteUdhar.rejected, rejected);
  },
});

export default udharSlice.reducer;
