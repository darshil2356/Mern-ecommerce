import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import productInquiryService from "./productInquiryService";

export const submitProductInquiry = createAsyncThunk(
  "productInquiry/submit",
  async (data, thunkAPI) => {
    try {
      return await productInquiryService.submitInquiry(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error?.response?.data?.message || error.message
      );
    }
  }
);

const productInquirySlice = createSlice({
  name: "productInquiry",
  initialState: { isLoading: false, isSuccess: false, isError: false, message: "" },
  reducers: {
    resetInquiryState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitProductInquiry.pending, (state) => { state.isLoading = true; state.isSuccess = false; state.isError = false; })
      .addCase(submitProductInquiry.fulfilled, (state) => { state.isLoading = false; state.isSuccess = true; })
      .addCase(submitProductInquiry.rejected, (state, action) => { state.isLoading = false; state.isError = true; state.message = action.payload; });
  },
});

export const { resetInquiryState } = productInquirySlice.actions;
export default productInquirySlice.reducer;
