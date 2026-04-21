import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import productInquiryService from "./productInquiryService";

export const getAllInquiries = createAsyncThunk("productInquiry/getAll", async (_, thunkAPI) => {
  try { return await productInquiryService.getAllInquiries(); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const updateInquiryStatus = createAsyncThunk("productInquiry/updateStatus", async (data, thunkAPI) => {
  try { return await productInquiryService.updateInquiryStatus(data); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const deleteInquiry = createAsyncThunk("productInquiry/delete", async (id, thunkAPI) => {
  try { return await productInquiryService.deleteInquiry(id); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const notifyRestocked = createAsyncThunk("productInquiry/notify", async (productId, thunkAPI) => {
  try { return await productInquiryService.notifyRestocked(productId); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const resetProductInquiryState = createAction("productInquiry/reset");

const productInquirySlice = createSlice({
  name: "productInquiry",
  initialState: {
    inquiries: [],
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: "",
    notifyResult: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllInquiries.pending, (s) => { s.isLoading = true; })
      .addCase(getAllInquiries.fulfilled, (s, a) => { s.isLoading = false; s.isSuccess = true; s.inquiries = a.payload; })
      .addCase(getAllInquiries.rejected, (s, a) => { s.isLoading = false; s.isError = true; s.message = a.error; })

      .addCase(updateInquiryStatus.fulfilled, (s, a) => {
        s.inquiries = s.inquiries.map((i) => i._id === a.payload._id ? a.payload : i);
      })

      .addCase(deleteInquiry.fulfilled, (s, a) => {
        s.inquiries = s.inquiries.filter((i) => i._id !== a.meta.arg);
      })

      .addCase(notifyRestocked.pending, (s) => { s.isLoading = true; s.notifyResult = null; })
      .addCase(notifyRestocked.fulfilled, (s, a) => { s.isLoading = false; s.isSuccess = true; s.notifyResult = a.payload; })
      .addCase(notifyRestocked.rejected, (s, a) => { s.isLoading = false; s.isError = true; s.message = a.error; })

      .addCase(resetProductInquiryState, () => ({
        inquiries: [], isLoading: false, isSuccess: false, isError: false, message: "", notifyResult: null,
      }));
  },
});

export default productInquirySlice.reducer;
