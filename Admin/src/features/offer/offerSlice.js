import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import offerService from "./offerService";

export const getAllOffers = createAsyncThunk("offer/get-all", async (_, thunkAPI) => {
  try { return await offerService.getOffers(); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const createOffer = createAsyncThunk("offer/create", async (data, thunkAPI) => {
  try { return await offerService.createOffer(data); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const getAnOffer = createAsyncThunk("offer/get-one", async (id, thunkAPI) => {
  try { return await offerService.getOffer(id); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const updateAnOffer = createAsyncThunk("offer/update", async (payload, thunkAPI) => {
  try { return await offerService.updateOffer(payload); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const deleteAnOffer = createAsyncThunk("offer/delete", async (id, thunkAPI) => {
  try { return await offerService.deleteOffer(id); }
  catch (e) { return thunkAPI.rejectWithValue(e); }
});

export const resetOfferState = createAction("offer/reset");

const initialState = {
  offers: [],
  singleOffer: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  createdOffer: null,
  updatedOffer: null,
};

const offerSlice = createSlice({
  name: "offer",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getAllOffers.pending, (s) => { s.isLoading = true; })
      .addCase(getAllOffers.fulfilled, (s, a) => { s.isLoading = false; s.isSuccess = true; s.offers = a.payload; })
      .addCase(getAllOffers.rejected, (s) => { s.isLoading = false; s.isError = true; })

      .addCase(createOffer.pending, (s) => { s.isLoading = true; })
      .addCase(createOffer.fulfilled, (s, a) => { s.isLoading = false; s.isSuccess = true; s.createdOffer = a.payload; })
      .addCase(createOffer.rejected, (s) => { s.isLoading = false; s.isError = true; })

      .addCase(getAnOffer.pending, (s) => { s.isLoading = true; })
      .addCase(getAnOffer.fulfilled, (s, a) => { s.isLoading = false; s.isSuccess = true; s.singleOffer = a.payload; })
      .addCase(getAnOffer.rejected, (s) => { s.isLoading = false; s.isError = true; })

      .addCase(updateAnOffer.pending, (s) => { s.isLoading = true; })
      .addCase(updateAnOffer.fulfilled, (s, a) => { s.isLoading = false; s.isSuccess = true; s.updatedOffer = a.payload; })
      .addCase(updateAnOffer.rejected, (s) => { s.isLoading = false; s.isError = true; })

      .addCase(deleteAnOffer.fulfilled, (s) => { s.isSuccess = true; })

      .addCase(resetOfferState, () => initialState);
  },
});

export default offerSlice.reducer;
