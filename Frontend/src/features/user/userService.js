import axios from "axios";
import axiosInstance, { base_url, getConfig } from "../../utils/axiosConfig";

// ── Public (no auth needed) ──────────────────────────────────────────────────

const register = async (userData) => {
  const response = await axios.post(`${base_url}user/register`, userData);
  if (response.data) {
    localStorage.setItem("customer", JSON.stringify(response.data));
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
  }
  return response.data;
};

const sendOTP = async (mobile) => {
  const response = await axios.post(`${base_url}user/send-otp`, { mobile });
  return response.data;
};

const verifyOTP = async (mobile, otp) => {
  const response = await axios.post(`${base_url}user/verify-otp`, { mobile, otp });
  return response.data;
};

const login = async (userData) => {
  const response = await axios.post(`${base_url}user/login`, userData);
  if (response.data) {
    localStorage.setItem("customer", JSON.stringify(response.data));
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
  }
  return response.data;
};

const forgotPasswordToken = async (data) => {
  const response = await axios.post(`${base_url}user/forgot-password-token`, data);
  return response.data;
};

const resetPass = async (data) => {
  const response = await axios.put(`${base_url}user/reset-password/${data.token}`, {
    password: data?.password,
  });
  return response.data;
};

// ── Authenticated (go through axiosInstance → interceptor handles refresh) ───

const getUserWislist = async () => {
  const response = await axiosInstance.get("user/wishlist");
  return response.data;
};

const addToCart = async (cartData) => {
  const response = await axiosInstance.post("user/cart", cartData);
  return response.data;
};

const addBundleToCart = async ({ bundleId, selectedOptions }) => {
  const response = await axiosInstance.post("user/cart/bundle", { bundleId, selectedOptions });
  return response.data;
};

const getCart = async () => {
  const response = await axiosInstance.get("user/cart");
  return response.data;
};

const removeProductFromCart = async (data) => {
  const response = await axiosInstance.delete(`user/delete-product-cart/${data.id}`);
  return response.data;
};

const updateProductFromCart = async (cartDetail) => {
  const response = await axiosInstance.delete(
    `user/update-product-cart/${cartDetail.cartItemId}/${cartDetail.quantity}`
  );
  return response.data;
};

const createOrder = async (orderDetail) => {
  const response = await axiosInstance.post("user/cart/create-order/", orderDetail);
  return response.data;
};

const getUserOrders = async ({ page = 1, limit = 10 } = {}) => {
  const response = await axiosInstance.get(`user/getmyorders?page=${page}&limit=${limit}`);
  return response.data;
};

const getUserSingleOrder = async (id) => {
  const response = await axiosInstance.get(`user/getmyorder/${id}`);
  return response.data;
};

const cancelOrder = async ({ id, cancelReason }) => {
  const response = await axiosInstance.put(`user/cancel-order/${id}`, { cancelReason });
  return response.data;
};

const updateUser = async (data) => {
  const response = await axiosInstance.put("user/edit-user", data.data);
  return response.data;
};

const emptyCart = async () => {
  const response = await axiosInstance.delete("user/empty-cart");
  return response.data;
};

const getReferralCode = async () => {
  const response = await axiosInstance.get("user/referral-code");
  return response.data;
};

const getMyReferrals = async ({ page = 1, limit = 10 } = {}) => {
  const response = await axiosInstance.get(
    `user/my-referrals?txnPage=${page}&txnLimit=${limit}`
  );
  return response.data;
};

const applyReferralCode = async (referralCode) => {
  const response = await axiosInstance.post("user/apply-referral", { referralCode });
  return response.data;
};

const getAddresses = async () => {
  const response = await axiosInstance.get("user/addresses");
  return response.data;
};

const addAddress = async (data) => {
  const response = await axiosInstance.post("user/addresses", data);
  return response.data;
};

const updateAddress = async ({ addrId, data }) => {
  const response = await axiosInstance.put(`user/addresses/${addrId}`, data);
  return response.data;
};

const deleteAddress = async (addrId) => {
  const response = await axiosInstance.delete(`user/addresses/${addrId}`);
  return response.data;
};

export const authService = {
  register,
  sendOTP,
  verifyOTP,
  login,
  getUserWislist,
  addToCart,
  addBundleToCart,
  getCart,
  removeProductFromCart,
  updateProductFromCart,
  createOrder,
  getUserOrders,
  getUserSingleOrder,
  cancelOrder,
  updateUser,
  forgotPasswordToken,
  resetPass,
  emptyCart,
  getReferralCode,
  getMyReferrals,
  applyReferralCode,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
};
