import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import bundleService from "./bundleService";

export const getBundles = createAsyncThunk(
  "bundle/get-bundles",
  async (thunkAPI) => {
    try {
      return await bundleService.getBundles();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getActiveBundles = createAsyncThunk(
  "bundle/get-active-bundles",
  async (thunkAPI) => {
    try {
      return await bundleService.getActiveBundles();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getBundle = createAsyncThunk(
  "bundle/get-bundle",
  async (id, thunkAPI) => {
    try {
      return await bundleService.getBundle(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getBundlesForProduct = createAsyncThunk(
  "bundle/get-bundles-for-product",
  async (productId, thunkAPI) => {
    try {
      return await bundleService.getBundlesForProduct(productId);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getBundleStats = createAsyncThunk(
  "bundle/get-bundle-stats",
  async (thunkAPI) => {
    try {
      return await bundleService.getBundleStats();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const createBundle = createAsyncThunk(
  "bundle/create-bundle",
  async (bundleData, thunkAPI) => {
    try {
      return await bundleService.createBundle(bundleData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const updateBundle = createAsyncThunk(
  "bundle/update-bundle",
  async (bundle, thunkAPI) => {
    try {
      return await bundleService.updateBundle(bundle);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const deleteBundle = createAsyncThunk(
  "bundle/delete-bundle",
  async (id, thunkAPI) => {
    try {
      return await bundleService.deleteBundle(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const resetBundleState = createAction("Reset_bundle_state");

const initialState = {
  bundles: [],
  activeBundles: [],
  bundle: null,
  productBundles: [],
  stats: null,
  isError: false,
  isLoading: false,
  isSuccess: false,
  message: "",
};

export const bundleSlice = createSlice({
  name: "bundle",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get all bundles
      .addCase(getBundles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBundles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.bundles = action.payload;
      })
      .addCase(getBundles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      // Get active bundles
      .addCase(getActiveBundles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getActiveBundles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.activeBundles = action.payload;
      })
      .addCase(getActiveBundles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      // Get single bundle
      .addCase(getBundle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBundle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.bundle = action.payload;
      })
      .addCase(getBundle.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      // Get bundles for product
      .addCase(getBundlesForProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBundlesForProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.productBundles = action.payload;
      })
      .addCase(getBundlesForProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      // Get bundle stats
      .addCase(getBundleStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBundleStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.stats = action.payload;
      })
      .addCase(getBundleStats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      // Create bundle
      .addCase(createBundle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createBundle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.createdBundle = action.payload;
      })
      .addCase(createBundle.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      // Update bundle
      .addCase(updateBundle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateBundle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.updatedBundle = action.payload;
      })
      .addCase(updateBundle.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      // Delete bundle
      .addCase(deleteBundle.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteBundle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.deletedBundle = action.payload;
      })
      .addCase(deleteBundle.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(resetBundleState, () => initialState);
  },
});

export default bundleSlice.reducer;

