import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import productService from "./productService";

export const getProducts = createAsyncThunk(
  "product/get-products",
  async (_, thunkAPI) => {
    try {
      return await productService.getProducts();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getAProduct = createAsyncThunk(
  "blog/get-product",
  async (id, thunkAPI) => {
    try {
      return await productService.getProduct(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const createProducts = createAsyncThunk(
  "product/create-products",
  async (productData, thunkAPI) => {
    try {
      return await productService.createProduct(productData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);
export const deleteAProduct = createAsyncThunk(
  "product/delete-product",
  async (id, thunkAPI) => {
    try {
      return await productService.deleteproduct(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const updateAProduct = createAsyncThunk(
  "product/update-product",
  async (brand, thunkAPI) => {
    try {
      return await productService.updateProduct(brand);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);
export const resetState = createAction("Reset_all");

const initialState = {
  products: [],
  variants: [],
  productHsn: "",
  hsnCode: "",
  vendorName: "",

  isError: false,
  isLoading: false,
  isSuccess: false,
  message: "",
};
export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.products = action.payload;
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(createProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.createdProduct = action.payload;
      })
      .addCase(createProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(getAProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.productName = action.payload.title;
        state.productDesc = action.payload.description;
        state.productPrice = action.payload.price;
        state.productBrand = action.payload.brand;
        state.productCategory = action.payload.category;
        state.productTag = action.payload.tags;
        state.productHsn = action.payload.hsnCode || "";
        state.hsnCode = action.payload.hsnCode || "";
//         state.productColors = action.payload.color?._id || "";
//         // state.productSize = action.payload.size;
//         state.productSize = action.payload.size || [];
// state.productVideos = action.payload.videos || [];


        state.productColors = action.payload.color?._id || "";
        state.productSize = action.payload.size || [];
        state.productVideos = action.payload.videos || [];
        state.productQuantity = action.payload.quantity;
        state.inventory = action.payload.inventory;
        state.sizeStock = action.payload.sizeStock || [];
        state.variants = action.payload.variants || [];
        state.productImages = action.payload.images;
        state.categoryId = action.payload.categoryId || null;
        state.subcategory = action.payload.subcategory || "";
        state.short_description = action.payload.short_description || "";
        state.highlights = action.payload.highlights || [];
        state.search_keywords = action.payload.search_keywords || [];
        state.mrp = action.payload.mrp || "";
        state.discount_percentage = action.payload.discount_percentage || "";
        state.sku = action.payload.sku || "";
        state.min_stock_alert = action.payload.min_stock_alert ?? 5;
        state.attributes = action.payload.attributes || {};
        state.seo = action.payload.seo || {};
        state.shipping = action.payload.shipping || {};
        state.reelUrl = action.payload.reelUrl || "";
        state.purchasePrice = action.payload.purchasePrice ?? "";
        state.pkey = action.payload.pkey ?? "";
        state.vendorName = action.payload.vendorName || "";
      })
      .addCase(getAProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(deleteAProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteAProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.deletedProduct = action.payload;
      })
      .addCase(deleteAProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(updateAProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.updatedProduct = action.payload;
      })
      .addCase(updateAProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(resetState, () => initialState);
  },
});
export default productSlice.reducer;
