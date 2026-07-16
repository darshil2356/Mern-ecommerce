import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../utils/axiosconfig";

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────

export const fetchCustomers = createAsyncThunk("wholesale/fetchCustomers", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/wholesale/customers", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createCustomer = createAsyncThunk("wholesale/createCustomer", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/wholesale/customers", payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateCustomer = createAsyncThunk("wholesale/updateCustomer", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/wholesale/customers/${id}`, payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteCustomer = createAsyncThunk("wholesale/deleteCustomer", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/wholesale/customers/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchCustomerLedger = createAsyncThunk("wholesale/fetchLedger", async (id, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/wholesale/customers/${id}/ledger`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ─── BILLS ────────────────────────────────────────────────────────────────────

export const fetchBills = createAsyncThunk("wholesale/fetchBills", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/wholesale/bills", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const createBill = createAsyncThunk("wholesale/createBill", async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post("/wholesale/bills", payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const updateBill = createAsyncThunk("wholesale/updateBill", async ({ id, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/wholesale/bills/${id}`, payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deleteBill = createAsyncThunk("wholesale/deleteBill", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/wholesale/bills/${id}`);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const addPayment = createAsyncThunk("wholesale/addPayment", async ({ billId, ...payload }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/wholesale/bills/${billId}/payment`, payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const deletePayment = createAsyncThunk("wholesale/deletePayment", async ({ billId, paymentId }, { rejectWithValue }) => {
  try {
    await api.delete(`/wholesale/bills/${billId}/payment/${paymentId}`);
    return { billId, paymentId };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});
export const fetchMonthlyReport = createAsyncThunk("wholesale/fetchMonthlyReport", async (params, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/wholesale/monthly-report", { params });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});
// ─── DASHBOARD & ALERTS ───────────────────────────────────────────────────────

export const fetchDashboard = createAsyncThunk("wholesale/fetchDashboard", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/wholesale/dashboard");
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchAlerts = createAsyncThunk("wholesale/fetchAlerts", async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get("/wholesale/alerts");
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message);
  }
});

// ─── SLICE ────────────────────────────────────────────────────────────────────

const wholesaleSlice = createSlice({
  name: "wholesale",
  initialState: {
    customers: [],
    bills: [],
    billSummary: { totalAmount: 0, totalPaid: 0, totalDue: 0 },
    pagination: { total: 0, page: 1, limit: 20, pages: 1 },
    ledger: null,
    monthlyReport: null,
    dashboard: null,
    alerts: null,
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    clearLedger: (state) => { state.ledger = null; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const actionPending = (state) => { state.actionLoading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.actionLoading = false; state.error = action.payload; };

    builder
      // Customers
      .addCase(fetchCustomers.pending, pending)
      .addCase(fetchCustomers.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.customers = payload.data;
      })
      .addCase(fetchCustomers.rejected, rejected)

      .addCase(createCustomer.pending, actionPending)
      .addCase(createCustomer.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.customers.unshift({ ...payload.data, totalSales: 0, totalPaid: 0, totalDue: payload.data.openingBalance || 0, billCount: 0 });
      })
      .addCase(createCustomer.rejected, rejected)

      .addCase(updateCustomer.pending, actionPending)
      .addCase(updateCustomer.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.customers.findIndex((c) => c._id === payload.data._id);
        if (idx !== -1) state.customers[idx] = { ...state.customers[idx], ...payload.data };
      })
      .addCase(updateCustomer.rejected, rejected)

      .addCase(deleteCustomer.pending, actionPending)
      .addCase(deleteCustomer.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.customers = state.customers.filter((c) => c._id !== payload);
      })
      .addCase(deleteCustomer.rejected, rejected)

      .addCase(fetchCustomerLedger.pending, pending)
      .addCase(fetchCustomerLedger.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.ledger = payload;
      })
      .addCase(fetchCustomerLedger.rejected, rejected)

      // Bills
      .addCase(fetchBills.pending, pending)
      .addCase(fetchBills.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.bills = payload.data;
        state.billSummary = payload.summary;
        state.pagination = payload.pagination;
      })
      .addCase(fetchBills.rejected, rejected)

      .addCase(createBill.pending, actionPending)
      .addCase(createBill.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.bills.unshift(payload.data);
        state.pagination.total += 1;
      })
      .addCase(createBill.rejected, rejected)

      .addCase(updateBill.pending, actionPending)
      .addCase(updateBill.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.bills.findIndex((b) => b._id === payload.data._id);
        if (idx !== -1) state.bills[idx] = payload.data;
      })
      .addCase(updateBill.rejected, rejected)

      .addCase(deleteBill.pending, actionPending)
      .addCase(deleteBill.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.bills = state.bills.filter((b) => b._id !== payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteBill.rejected, rejected)

      .addCase(addPayment.pending, actionPending)
      .addCase(addPayment.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.bills.findIndex((b) => b._id === payload.data._id);
        if (idx !== -1) state.bills[idx] = payload.data;
      })
      .addCase(addPayment.rejected, rejected)

      .addCase(deletePayment.pending, actionPending)
      .addCase(deletePayment.fulfilled, (state) => { state.actionLoading = false; })
      .addCase(deletePayment.rejected, rejected)

      // Dashboard
      .addCase(fetchDashboard.pending, pending)
      .addCase(fetchDashboard.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.dashboard = payload;
      })
      .addCase(fetchDashboard.rejected, rejected)

      // Alerts
      .addCase(fetchAlerts.pending, pending)
      .addCase(fetchAlerts.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.alerts = payload;
      })
      .addCase(fetchAlerts.rejected, rejected)

      // Monthly Report
      .addCase(fetchMonthlyReport.pending, pending)
      .addCase(fetchMonthlyReport.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.monthlyReport = payload;
      })
      .addCase(fetchMonthlyReport.rejected, rejected);
  },
});

export const { clearError, clearLedger } = wholesaleSlice.actions;
export default wholesaleSlice.reducer;
