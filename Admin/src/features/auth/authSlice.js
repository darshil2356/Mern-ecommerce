import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import authService from "./authServices";
import { toast } from "react-toastify";

const getUserfromLocalStorage = localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;
const initialState = {
  user: getUserfromLocalStorage,
  orders: [],
  isError: false,
  isLoading: false,
  isSuccess: false,
  message: "",
  monthlyReport: null,
  yearlyReport: null,
  dateRangeReport: null,
  gstReport: null,
  productWiseReport: null,
  customerWiseReport: null,
};
export const login = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getOrders = createAsyncThunk(
  "order/get-orders",
  async (paymentFilter, thunkAPI) => {
    try {
      return await authService.getOrders(paymentFilter);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);
export const getaOrder = createAsyncThunk(
  "order/get-order",
  async (id, thunkAPI) => {
    try {
      return await authService.getOrder(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const updateAOrder = createAsyncThunk(
  "order/update-order",
  async (data, thunkAPI) => {
    try {
      return await authService.updateOrder(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const adminCancelAOrder = createAsyncThunk(
  "order/admin-cancel-order",
  async ({ id, cancelReason }, thunkAPI) => {
    try {
      return await authService.adminCancelOrder({ id, cancelReason });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getMonthlyData = createAsyncThunk(
  "orders/monlthdata",
  async (data, thunkAPI) => {
    try {
      return await authService.getMonthlyOrders(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getDailySalesData = createAsyncThunk(
  "orders/dailysales",
  async (data, thunkAPI) => {
    try {
      return await authService.getDailySales(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getDashboardStatsData = createAsyncThunk(
  "orders/dashboardstats",
  async (data, thunkAPI) => {
    try {
      return await authService.getDashboardStats(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getYearlyData = createAsyncThunk(
  "orders/yearlydata",
  async (data, thunkAPI) => {
    try {
      return await authService.getYearlyStats(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getMonthlyReportData = createAsyncThunk(
  "reports/monthly",
  async ({ month, year, paymentFilter }, thunkAPI) => {
    try {
      return await authService.getMonthlyReport(month, year, paymentFilter);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getYearlyReportData = createAsyncThunk(
  "reports/yearly",
  async ({ year, paymentFilter }, thunkAPI) => {
    try {
      return await authService.getYearlyReport(year, paymentFilter);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getDateRangeReportData = createAsyncThunk(
  "reports/daterange",
  async ({ startDate, endDate, paymentFilter }, thunkAPI) => {
    try {
      return await authService.getDateRangeReport(startDate, endDate, paymentFilter);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getGSTReportData = createAsyncThunk(
  "reports/gst",
  async ({ month, year, paymentFilter }, thunkAPI) => {
    try {
      return await authService.getGSTReport(month, year, paymentFilter);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getProductWiseReportData = createAsyncThunk(
  "reports/productwise",
  async ({ startDate, endDate, paymentFilter }, thunkAPI) => {
    try {
      return await authService.getProductWiseReport(startDate, endDate, paymentFilter);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getCustomerWiseReportData = createAsyncThunk(
  "reports/customerwise",
  async ({ startDate, endDate, paymentFilter }, thunkAPI) => {
    try {
      return await authService.getCustomerWiseReport(startDate, endDate, paymentFilter);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const logout = createAction("auth/logout");

export const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {},
  extraReducers: (buildeer) => {
    buildeer
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.message = "success";
      })
      .addCase(login.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      .addCase(getOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.orders = action.payload;
        state.message = "success";
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      .addCase(updateAOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAOrder.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.updateorder = action.payload;
        const updated = action.payload?.order || action.payload;
        if (updated?._id) {
          const idx = state.orders.findIndex((o) => o._id === updated._id);
          if (idx !== -1) state.orders[idx] = updated;
        }
        toast.success("Order Status Changed");
      })
      .addCase(updateAOrder.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      .addCase(adminCancelAOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(adminCancelAOrder.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        const cancelled = action.payload?.order;
        state.singleorder = { orders: cancelled };
        if (cancelled?._id) {
          const idx = state.orders.findIndex((o) => o._id === cancelled._id);
          if (idx !== -1) state.orders[idx] = cancelled;
        }
        toast.success("Order cancelled successfully");
      })
      .addCase(adminCancelAOrder.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
        toast.error(action.payload?.response?.data?.message || "Failed to cancel order");
      })
      .addCase(getaOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getaOrder.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.singleorder = action.payload;
        state.message = "success";
      })
      .addCase(getaOrder.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      .addCase(getMonthlyData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMonthlyData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.monthlyData = action.payload;
        state.message = "success";
      })
      .addCase(getMonthlyData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      .addCase(getDailySalesData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDailySalesData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.dailySalesData = action.payload;
        state.message = "success";
      })
      .addCase(getDailySalesData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      .addCase(getDashboardStatsData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDashboardStatsData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.dashboardStats = action.payload;
        state.message = "success";
      })
      .addCase(getDashboardStatsData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      .addCase(getYearlyData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getYearlyData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.yearlyData = action.payload;
        state.message = "success";
      })
.addCase(getYearlyData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      // Monthly Report
      .addCase(getMonthlyReportData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMonthlyReportData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.monthlyReport = action.payload;
        state.message = "success";
      })
      .addCase(getMonthlyReportData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      // Yearly Report
      .addCase(getYearlyReportData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getYearlyReportData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.yearlyReport = action.payload;
        state.message = "success";
      })
      .addCase(getYearlyReportData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      // Date Range Report
      .addCase(getDateRangeReportData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getDateRangeReportData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.dateRangeReport = action.payload;
        state.message = "success";
      })
      .addCase(getDateRangeReportData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      // GST Report
      .addCase(getGSTReportData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getGSTReportData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.gstReport = action.payload;
        state.message = "success";
      })
      .addCase(getGSTReportData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      // Product Wise Report
      .addCase(getProductWiseReportData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProductWiseReportData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.productWiseReport = action.payload;
        state.message = "success";
      })
      .addCase(getProductWiseReportData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      // Customer Wise Report
      .addCase(getCustomerWiseReportData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCustomerWiseReportData.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.customerWiseReport = action.payload;
        state.message = "success";
      })
      .addCase(getCustomerWiseReportData.rejected, (state, action) => {
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        state.isLoading = false;
      })
      .addCase(logout, (state) => {
        state.user = null;
        state.orders = [];
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = false;
        state.message = "";
      });
  },
});

export default authSlice.reducer;
