
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axios from "axios";

// // GET customers
// export const getCustomers = createAsyncThunk(
//   "customer/getCustomers",
//   async () => {
//     const response = await axios.get("/api/customers");
//     return response.data;
//   }
// );

// // CREATE customer
// export const createCustomer = createAsyncThunk(
//   "customer/createCustomer",
//   async (data) => {
//     const response = await axios.post("/api/customers", data);
//     return response.data;
//   }
// );

// const customerSlice = createSlice({
//   name: "customer",
//   initialState: {
//     customers: [],
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder.addCase(getCustomers.fulfilled, (state, action) => {
//       state.customers = action.payload;
//     });
//   },
// });

// export default customerSlice.reducer;



import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { base_url } from "../../utils/baseUrl";
import { config } from "../../utils/axiosconfig";

// GET users (customers)
export const getCustomers = createAsyncThunk(
  "customer/getCustomers",
  async () => {
    const response = await axios.get(`${base_url}user/all-users`, config);
    return response.data;
  }
);

// CREATE offline user
export const createCustomer = createAsyncThunk(
  "customer/createCustomer",
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${base_url}user/create-customer`,
        data,
        config
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// GET customer details with order history
export const getCustomerDetails = createAsyncThunk(
  "customer/getCustomerDetails",
  async (id) => {
    const response = await axios.get(`${base_url}user/customer/${id}`, config);
    return response.data;
  }
);

// UPDATE customer
export const updateCustomer = createAsyncThunk(
  "customer/updateCustomer",
  async ({ id, customerData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${base_url}user/update-customer/${id}`,
        customerData,
        config
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// DELETE customer
export const deleteCustomer = createAsyncThunk(
  "customer/deleteCustomer",
  async (id) => {
    const response = await axios.delete(
      `${base_url}user/delete-customer/${id}`,
      config
    );
    return response.data;
  }
);

// GET all referrals (for admin)
export const getAllReferrals = createAsyncThunk(
  "customer/getAllReferrals",
  async () => {
    const response = await axios.get(`${base_url}user/all-referrals`, config);
    return response.data;
  }
);

const customerSlice = createSlice({
  name: "customer",
  initialState: {
    customers: [],
    customerDetails: null,
    referrals: null,
    referralStats: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCustomers.fulfilled, (state, action) => {
        state.customers = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
        state.error = null;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.error = null;
        const index = state.customers.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.customers = state.customers.filter(c => c._id !== action.payload._id);
      })
      .addCase(getCustomerDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCustomerDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.customerDetails = action.payload;
      })
      .addCase(getCustomerDetails.rejected, (state) => {
        state.loading = false;
      })
      .addCase(getAllReferrals.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAllReferrals.fulfilled, (state, action) => {
        state.loading = false;
        state.referrals = action.payload.referrals;
        state.referralStats = action.payload.statistics;
      })
      .addCase(getAllReferrals.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default customerSlice.reducer;
