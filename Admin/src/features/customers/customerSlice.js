
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
  async (data) => {
    const response = await axios.post(
      `${base_url}user/create-customer`,
      data,
      config
    );
    return response.data;
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

const customerSlice = createSlice({
  name: "customer",
  initialState: {
    customers: [],
    customerDetails: null,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getCustomers.fulfilled, (state, action) => {
        state.customers = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
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
      });
  },
});

export default customerSlice.reducer;
