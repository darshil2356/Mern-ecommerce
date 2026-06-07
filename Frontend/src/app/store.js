import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "redux";
import authReducer from "../features/user/userSlice";
import productReducer from "../features/products/productSlilce";
import blogReducer from "../features/blogs/blogSlice";
import contactReducer from "../features/contact/contactSlice";
import productInquiryReducer from "../features/productInquiry/productInquirySlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["blog"], // product state not persisted so reviews always load fresh
  version: 1,
};

const rootReducer = combineReducers({
  auth: authReducer,
  product: productReducer,
  blog: blogReducer,
  contact: contactReducer,
  productInquiry: productInquiryReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
