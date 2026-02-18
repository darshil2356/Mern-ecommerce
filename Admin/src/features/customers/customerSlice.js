import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { base_url } from "../../utils/baseUrl";

const initialState = {
  customers: [],
  isLoading: false,
  isError: false,
};

// GET USERS
export const getUsers = createAsyncThunk(
  "customers/get-users",
  async (_, thunkAPI) => {
    try {
      const response = await axios.get(`${base_url}user/all-users`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

// CREATE CUSTOMER
export const createCustomer = createAsyncThunk(
  "customers/create-customer",
  async (userData, thunkAPI) => {
    try {
      const response = await axios.post(
        `${base_url}user/create-customer`,
        userData
      );
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUsers.fulfilled, (state, action) => {
        state.customers = action.payload;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.customers.push(action.payload);
      });
  },
});

export default customerSlice.reducer;