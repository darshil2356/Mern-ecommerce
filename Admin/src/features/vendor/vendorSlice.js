import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import vendorService from "./vendorService";

export const getVendors = createAsyncThunk("vendor/get-all", async (_, thunkAPI) => {
  try { return await vendorService.getVendors(); }
  catch (error) { return thunkAPI.rejectWithValue(error); }
});

export const createVendor = createAsyncThunk("vendor/create", async (data, thunkAPI) => {
  try { return await vendorService.createVendor(data); }
  catch (error) { return thunkAPI.rejectWithValue(error); }
});

const vendorSlice = createSlice({
  name: "vendor",
  initialState: { vendors: [], isLoading: false, isError: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getVendors.pending, (state) => { state.isLoading = true; })
      .addCase(getVendors.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        state.vendors = Array.isArray(payload) ? payload : (payload?.vendors || payload?.data || []);
      })
      .addCase(getVendors.rejected, (state) => { state.isLoading = false; state.isError = true; })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.vendors.push(action.payload);
      });
  },
});

export default vendorSlice.reducer;
