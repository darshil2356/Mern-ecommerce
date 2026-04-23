import { createSlice, createAsyncThunk, createAction } from "@reduxjs/toolkit";
import { authService } from "./userService";
import { toast } from "react-toastify";

export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, thunkAPI) => {
    try {
      return await authService.register(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (userData, thunkAPI) => {
    try {
      return await authService.login(userData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getuserProductWishlist = createAsyncThunk(
  "user/wishlist",
  async (thunkAPI) => {
    try {
      return await authService.getUserWislist();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const addProdToCart = createAsyncThunk(
  "user/cart/add",
  async (cartData, thunkAPI) => {
    try {
      return await authService.addToCart(cartData);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const addBundleToCart = createAsyncThunk(
  "user/cart/add-bundle",
  async ({ bundleId, selectedOptions }, thunkAPI) => {
    try {
      return await authService.addBundleToCart({ bundleId, selectedOptions });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getUserCart = createAsyncThunk(
  "user/cart/get",
  async (data, thunkAPI) => {
    try {
      return await authService.getCart(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const deleteUserCart = createAsyncThunk(
  "user/cart/delete",
  async (data, thunkAPI) => {
    try {
      return await authService.emptyCart(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getOrders = createAsyncThunk(
  "user/orders/get",
  async ({ page = 1, limit = 10 } = {}, thunkAPI) => {
    try {
      return await authService.getUserOrders({ page, limit });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getSingleOrder = createAsyncThunk(
  "user/order/get",
  async (id, thunkAPI) => {
    try {
      return await authService.getUserSingleOrder(id);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const deleteCartProduct = createAsyncThunk(
  "user/cart/product/delete",
  async (data, thunkAPI) => {
    try {
      return await authService.removeProductFromCart(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const createAnOrder = createAsyncThunk(
  "user/cart/create-order",
  async (orderDetail, thunkAPI) => {
    try {
      return await authService.createOrder(orderDetail);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const updateCartProduct = createAsyncThunk(
  "user/cart/product/update",
  async (cartDetail, thunkAPI) => {
    try {
      return await authService.updateProductFromCart(cartDetail);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "user/profile/update",
  async (data, thunkAPI) => {
    try {
      return await authService.updateUser({ data });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const forgotPasswordToken = createAsyncThunk(
  "user/password/token",
  async (data, thunkAPI) => {
    try {
      return await authService.forgotPasswordToken(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const resetPassword = createAsyncThunk(
  "user/password/reset",
  async (data, thunkAPI) => {
    try {
      return await authService.resetPass(data);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getReferralCode = createAsyncThunk(
  "user/referral/getCode",
  async (thunkAPI) => {
    try {
      return await authService.getReferralCode();
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getMyReferrals = createAsyncThunk(
  "user/referral/getMyReferrals",
  async ({ page = 1, limit = 10 } = {}, thunkAPI) => {
    try {
      return await authService.getMyReferrals({ page, limit });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const applyReferralCode = createAsyncThunk(
  "user/referral/apply",
  async (referralCode, thunkAPI) => {
    try {
      return await authService.applyReferralCode(referralCode);
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "user/order/cancel",
  async ({ id, cancelReason }, thunkAPI) => {
    try {
      return await authService.cancelOrder({ id, cancelReason });
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  }
);

export const getAddresses = createAsyncThunk(
  "user/addresses/get",
  async (_, thunkAPI) => {
    try { return await authService.getAddresses(); }
    catch (error) { return thunkAPI.rejectWithValue(error); }
  }
);

export const addAddress = createAsyncThunk(
  "user/addresses/add",
  async (data, thunkAPI) => {
    try { return await authService.addAddress(data); }
    catch (error) { return thunkAPI.rejectWithValue(error); }
  }
);

export const updateAddress = createAsyncThunk(
  "user/addresses/update",
  async ({ addrId, data }, thunkAPI) => {
    try { return await authService.updateAddress({ addrId, data }); }
    catch (error) { return thunkAPI.rejectWithValue(error); }
  }
);

export const deleteAddress = createAsyncThunk(
  "user/addresses/delete",
  async (addrId, thunkAPI) => {
    try { return await authService.deleteAddress(addrId); }
    catch (error) { return thunkAPI.rejectWithValue(error); }
  }
);

export const logout = createAction("auth/logout");
export const resetState = createAction("Reset_all");
export const resetAuthFlags = createAction("auth/resetFlags");

const getCustomerfromLocalStorage = localStorage.getItem("customer")
  ? JSON.parse(localStorage.getItem("customer"))
  : null;

const initialState = {
  user: getCustomerfromLocalStorage,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: "",
  // Referral state
  referralCode: "",
  referralCount: 0,
  coins: getCustomerfromLocalStorage?.coins || 0,
  signedInCount: 0,
  orderedCount: 0,
  referrals: [],
  coinTransactions: [],
  coinTransactionsPage: 1,
  coinTransactionsLimit: 10,
  coinTransactionsHasMore: false,
  coinTransactionsTotal: 0,
  appliedReferral: null,
  addresses: [],
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.createdUser = action.payload;
        // Auto-login: set user in Redux state so PrivateRoutes work immediately
        state.user = action.payload;
        if (action.payload?.referralCode) {
          state.referralCode = action.payload.referralCode;
        }
        if (action.payload?.coins !== undefined) {
          state.coins = action.payload.coins;
        }
        if (state.isSuccess === true) {
          toast.success("Account created successfully! Welcome aboard 🎉");
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError === true) {
          toast.error(action.payload?.response?.data?.message || "Registration failed");
        }
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.referralCode = action.payload.referralCode || "";
        state.coins = action.payload.coins || 0;
        if (state.isSuccess === true) {
          localStorage.setItem("token", action.payload.token);

          // Update localStorage with referral code
          let currentUserData = JSON.parse(localStorage.getItem("customer") || "{}");
          let newUserData = {
            ...currentUserData,
            _id: action.payload._id,
            token: action.payload.token,
            firstname: action.payload.firstname,
            lastname: action.payload.lastname,
            email: action.payload.email,
            mobile: action.payload.mobile,
            referralCode: action.payload.referralCode || "",
            coins: action.payload.coins || 0,
          };
          localStorage.setItem("customer", JSON.stringify(newUserData));

          toast.info("User Logged In Successfully");
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError === true) {
          toast.error(action.payload?.response?.data?.message || "Login failed");
        }
      })
      .addCase(getuserProductWishlist.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getuserProductWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.wishlist = action.payload;
      })
      .addCase(getuserProductWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(addProdToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addProdToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.cartProduct = action.payload;
        if (state.isSuccess) {
          toast.success("Product Added To Cart");
        }
      })
      .addCase(addProdToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(addBundleToCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addBundleToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.cartProduct = action.payload;
      })
      .addCase(addBundleToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(getUserCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.cartProducts = action.payload;
      })
      .addCase(getUserCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(getSingleOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSingleOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.singleOrder = action.payload;
      })
      .addCase(getSingleOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(deleteCartProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCartProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.deletedCartProduct = action.payload;
        if (state.isSuccess) {
          toast.success("Product Deleted From Cart Successfully!");
        }
      })
      .addCase(deleteCartProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError) {
          toast.error("Something Went Wrong!");
        }
      })
      .addCase(updateCartProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCartProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.updatedCartProduct = action.payload;
        if (state.isSuccess) {
          toast.success("Product Updated Successfully!");
        }
      })
      .addCase(updateCartProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError) {
          toast.error("Something Went Wrong!");
        }
      })
      .addCase(createAnOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createAnOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.orderedProduct = action.payload;
        // Deduct coins from Redux state immediately
        if (action.meta?.arg?.coinsUsed > 0) {
          state.coins = Math.max(0, (state.coins || 0) - action.meta.arg.coinsUsed);
        }
        if (state.isSuccess) {
          toast.success("Ordered created Successfully!");
        }
      })
      .addCase(createAnOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError) {
          toast.error("Something Went Wrong!");
        }
      })
      .addCase(getOrders.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        const { orders, page, total, hasMore } = action.payload;
        if (page === 1) {
          // First page — replace
          state.getorderedProduct = { orders, total, hasMore, page };
        } else {
          // Subsequent pages — append
          const existing = state.getorderedProduct?.orders || [];
          state.getorderedProduct = {
            orders: [...existing, ...orders],
            total,
            hasMore,
            page,
          };
        }
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.updatedUser = action.payload;
        if (state.isSuccess === true) {
          let currentUserData = JSON.parse(localStorage.getItem("customer")) || {};
          let newUserData = {
            ...currentUserData,
            firstname: action?.payload?.firstname,
            lastname: action?.payload?.lastname,
            email: action?.payload?.email,
            mobile: action?.payload?.mobile,
          };
          localStorage.setItem("customer", JSON.stringify(newUserData));
          state.user = { ...state.user, ...newUserData };
          toast.success("Profile Updated Successfully!");
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError) {
          toast.error("Something Went Wrong!");
        }
      })

      .addCase(forgotPasswordToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPasswordToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.token = action.payload;
        if (state.isSuccess) {
          toast.success("Forgot Password Email Sent Successfully!");
        }
      })
      .addCase(forgotPasswordToken.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError) {
          toast.error("Something Went Wrong!");
        }
      })
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.pass = action.payload;
        if (state.isSuccess) {
          toast.success("Password change Successfully!");
        }
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError) {
          toast.error("Something Went Wrong!");
        }
      })
      .addCase(deleteUserCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteUserCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.deletedCart = action.payload;
      })
      .addCase(deleteUserCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      // Referral reducers
      .addCase(getReferralCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getReferralCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.referralCode = action.payload.referralCode;
        state.referralCount = action.payload.referralCount;
        state.coins = action.payload.coins || 0;
      })
      .addCase(getReferralCode.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(getMyReferrals.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMyReferrals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.referralCode = action.payload.referralCode;
        state.referralCount = action.payload.referralCount;
        state.coins = action.payload.coins;
        state.signedInCount = action.payload.signedInCount;
        state.orderedCount = action.payload.orderedCount;
        state.referrals = action.payload.referrals;
        const page = action.payload.coinTransactionsPage || 1;
        const limit = action.payload.coinTransactionsLimit || 10;
        const hasMore = action.payload.coinTransactionsHasMore || false;
        const total = action.payload.coinTransactionsTotal || 0;

        if (page === 1) {
          state.coinTransactions = action.payload.coinTransactions || [];
        } else {
          state.coinTransactions = [
            ...(state.coinTransactions || []),
            ...(action.payload.coinTransactions || []),
          ];
        }
        state.coinTransactionsPage = page;
        state.coinTransactionsLimit = limit;
        state.coinTransactionsHasMore = hasMore;
        state.coinTransactionsTotal = total;
      })
      .addCase(getMyReferrals.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
      })
      .addCase(applyReferralCode.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(applyReferralCode.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        state.appliedReferral = action.payload;
        if (state.isSuccess) {
          toast.success("Referral code applied successfully!");
        }
      })
      .addCase(applyReferralCode.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        if (state.isError) {
          toast.error(action.payload?.response?.data?.message || "Something Went Wrong!");
        }
      })
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isError = false;
        state.isSuccess = true;
        // Update the order status in singleOrder if it matches
        if (state.singleOrder?.orders?._id === action.payload?.order?._id) {
          state.singleOrder.orders.orderStatus = "Cancelled";
          state.singleOrder.orders.cancelledAt = action.payload?.order?.cancelledAt;
          state.singleOrder.orders.cancelReason = action.payload?.order?.cancelReason;
        }
        // Update in orders list too
        if (state.getorderedProduct?.orders) {
          state.getorderedProduct.orders = state.getorderedProduct.orders.map(o =>
            o._id === action.payload?.order?._id
              ? { ...o, orderStatus: "Cancelled" }
              : o
          );
        }
        toast.success("Order cancelled successfully");
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.isSuccess = false;
        state.message = action.error;
        toast.error(action.payload?.response?.data?.message || "Failed to cancel order");
      })
      // Address reducers
      .addCase(getAddresses.fulfilled, (state, action) => { state.addresses = action.payload; })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
        toast.success("Address saved!");
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
        toast.success("Address updated!");
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
        toast.success("Address removed!");
      })
      .addCase(logout, (state) => {
        state.user = null;
        state.isError = false;
        state.isSuccess = false;
        state.isLoading = false;
        state.message = "";
        state.referralCode = "";
        state.referralCount = 0;
        state.coins = 0;
        state.signedInCount = 0;
        state.orderedCount = 0;
        state.referrals = [];
        state.coinTransactions = [];
        state.appliedReferral = null;
        state.addresses = [];
      })
      .addCase(resetState, () => initialState)
      .addCase(resetAuthFlags, (state) => {
        state.isError = false;
        state.isSuccess = false;
        state.isLoading = false;
        state.message = "";
      });
  },
});

export default authSlice.reducer;
