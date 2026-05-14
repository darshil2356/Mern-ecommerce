import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axiosconfig";

export const fetchPurchases = createAsyncThunk("purchase/fetchAll", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/purchase", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchPurchase = createAsyncThunk("purchase/fetchOne", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/purchase/${id}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createPurchase = createAsyncThunk("purchase/create", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/purchase", payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updatePurchase = createAsyncThunk("purchase/update", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/purchase/${id}`, payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deletePurchase = createAsyncThunk("purchase/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/purchase/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const recordPurchasePayment = createAsyncThunk("purchase/pay", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/purchase/${id}/pay`, payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchPurchaseSummary = createAsyncThunk("purchase/summary", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/purchase/summary", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// Vendor ledger
export const fetchVendors = createAsyncThunk("purchase/fetchVendors", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/vendor", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createVendor = createAsyncThunk("purchase/createVendor", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/vendor", payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateVendor = createAsyncThunk("purchase/updateVendor", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/vendor/${id}`, payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteVendor = createAsyncThunk("purchase/deleteVendor", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/vendor/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchVendorLedger = createAsyncThunk("purchase/vendorLedger", async ({ id, ...params }, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/vendor/${id}/ledger`, { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

const purchaseSlice = createSlice({
  name: "purchase",
  initialState: {
    purchases: [],
    currentPurchase: null,
    total: 0,
    totals: { totalAmount: 0, totalPaid: 0, totalDue: 0 },
    vendors: [],
    vendorsGrandTotal: { totalPurchases: 0, totalPaid: 0, totalDue: 0 },
    vendorLedger: null,
    summary: null,
    loading: false,
    error: null,
    vendorsVisible: localStorage.getItem("vendorsVisible") === "true",
  },
  reducers: {
    clearCurrentPurchase: (state) => { state.currentPurchase = null; },
    clearVendorLedger: (state) => { state.vendorLedger = null; },
    toggleVendorsVisible: (state) => {
      state.vendorsVisible = !state.vendorsVisible;
      localStorage.setItem("vendorsVisible", state.vendorsVisible);
    },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(fetchPurchases.pending, pending)
      .addCase(fetchPurchases.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.purchases = payload.purchases;
        state.total = payload.total;
        state.totals = payload.totals;
      })
      .addCase(fetchPurchases.rejected, rejected)

      .addCase(fetchPurchase.pending, pending)
      .addCase(fetchPurchase.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.currentPurchase = payload;
      })
      .addCase(fetchPurchase.rejected, rejected)

      .addCase(createPurchase.pending, pending)
      .addCase(createPurchase.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.purchases.unshift(payload);
      })
      .addCase(createPurchase.rejected, rejected)

      .addCase(updatePurchase.pending, pending)
      .addCase(updatePurchase.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.purchases.findIndex(p => p._id === payload._id);
        if (idx !== -1) state.purchases[idx] = payload;
        state.currentPurchase = payload;
      })
      .addCase(updatePurchase.rejected, rejected)

      .addCase(deletePurchase.pending, pending)
      .addCase(deletePurchase.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.purchases = state.purchases.filter(p => p._id !== payload);
      })
      .addCase(deletePurchase.rejected, rejected)

      .addCase(recordPurchasePayment.pending, pending)
      .addCase(recordPurchasePayment.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.purchases.findIndex(p => p._id === payload._id);
        if (idx !== -1) state.purchases[idx] = payload;
        state.currentPurchase = payload;
      })
      .addCase(recordPurchasePayment.rejected, rejected)

      .addCase(fetchPurchaseSummary.pending, pending)
      .addCase(fetchPurchaseSummary.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.summary = payload;
      })
      .addCase(fetchPurchaseSummary.rejected, rejected)

      .addCase(fetchVendors.pending, pending)
      .addCase(fetchVendors.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.vendors = payload.vendors;
        state.vendorsGrandTotal = payload.grandTotal;
      })
      .addCase(fetchVendors.rejected, rejected)

      .addCase(createVendor.pending, pending)
      .addCase(createVendor.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.vendors.push({ ...payload, totalPurchases: 0, totalPaid: 0, totalDue: 0, billCount: 0 });
      })
      .addCase(createVendor.rejected, rejected)

      .addCase(updateVendor.pending, pending)
      .addCase(updateVendor.fulfilled, (state, { payload }) => {
        state.loading = false;
        const idx = state.vendors.findIndex(v => v._id === payload._id);
        if (idx !== -1) state.vendors[idx] = { ...state.vendors[idx], ...payload };
      })
      .addCase(updateVendor.rejected, rejected)

      .addCase(deleteVendor.pending, pending)
      .addCase(deleteVendor.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.vendors = state.vendors.filter(v => v._id !== payload);
      })
      .addCase(deleteVendor.rejected, rejected)

      .addCase(fetchVendorLedger.pending, pending)
      .addCase(fetchVendorLedger.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.vendorLedger = payload;
      })
      .addCase(fetchVendorLedger.rejected, rejected);
  },
});

export const { clearCurrentPurchase, clearVendorLedger, toggleVendorsVisible } = purchaseSlice.actions;
export default purchaseSlice.reducer;
