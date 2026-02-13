

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import uploadService from "./uploadService";

/* ---------- IMAGE UPLOAD ---------- */
export const uploadImg = createAsyncThunk(
  "upload/images",
  async (files, thunkAPI) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      return await uploadService.uploadImg(formData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

/* ---------- VIDEO UPLOAD ---------- */
export const uploadVideo = createAsyncThunk(
  "upload/videos",
  async (files, thunkAPI) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("videos", file));
      return await uploadService.uploadVideo(formData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

/* ---------- DELETE IMAGE ---------- */
export const delImg = createAsyncThunk(
  "delete/image",
  async (id, thunkAPI) => {
    return await uploadService.deleteImg(id);
  }
);

/* ---------- DELETE VIDEO ---------- */
export const delVideo = createAsyncThunk(
  "delete/video",
  async (id, thunkAPI) => {
    return await uploadService.deleteVideo(id);
  }
);

const initialState = {
  images: [],
  videos: [],
  isLoading: false,
  isError: false,
  isSuccess: false,
};

const uploadSlice = createSlice({
  name: "upload",
  initialState,
  reducers: {
     clearUploads: (state) => {
    state.images = [];
    state.videos = [];
    state.isLoading = false;
    state.isError = false;
    state.isSuccess = false;
  },
  },
  extraReducers: (builder) => {
    builder
      /* images */
      .addCase(uploadImg.fulfilled, (state, action) => {
        // state.images = action.payload;
        state.images.push(...action.payload);

      })
      .addCase(delImg.fulfilled, (state) => {
        state.images = [];
      })

      /* videos */
      .addCase(uploadVideo.fulfilled, (state, action) => {
        state.videos.push(...action.payload);

      })
      .addCase(delVideo.fulfilled, (state) => {
        state.videos = [];
      });
  },
});



export default uploadSlice.reducer;

export const { clearUploads } = uploadSlice.actions;
