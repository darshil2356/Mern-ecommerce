import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
// import customerReducer from "../features/cutomers/customerSlice";
import customerReducer from "../features/customers/customerSlice";

import productReducer from "../features/product/productSlice";
import brandReducer from "../features/brand/brandSlice";
import pCategoryReducer from "../features/pcategory/pcategorySlice";
import bCategoryReducer from "../features/bcategory/bcategorySlice";
import blogReducer from "../features/blogs/blogSlice";
import colorReducer from "../features/color/colorSlice";
import enquiryReducer from "../features/enquiry/enquirySlice";
import uploadReducer from "../features/upload/uploadSlice";
import couponReducer from "../features/coupon/couponSlice";
import bundleReducer from "../features/bundle/bundleSlice";
import marketIntelReducer from "../features/marketIntel/marketIntelSlice";
import rojmelReducer from "../features/rojmel/rojmelSlice";
import offerReducer from "../features/offer/offerSlice";
import sizeReducer from "../features/size/sizeSlice";
import productInquiryReducer from "../features/productInquiry/productInquirySlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    customer: customerReducer,
    product: productReducer,
    brand: brandReducer,
    pCategory: pCategoryReducer,
    bCategory: bCategoryReducer,
    blogs: blogReducer,
    color: colorReducer,
    enquiry: enquiryReducer,
    upload: uploadReducer,
    coupon: couponReducer,
    bundle: bundleReducer,
    marketIntel: marketIntelReducer,
    rojmel: rojmelReducer,
    offer: offerReducer,
    size: sizeReducer,
    productInquiry: productInquiryReducer,
  },
});
