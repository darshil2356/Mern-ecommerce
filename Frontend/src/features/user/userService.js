import axios from "axios";
import { base_url, config, getConfig } from "../../utils/axiosConfig";

const register = async (userData) => {
  const response = await axios.post(`${base_url}user/register`, userData);
  if (response.data) {
    // Auto-login: save user data to localStorage just like login does
    localStorage.setItem("customer", JSON.stringify(response.data));
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
  }
  return response.data;
};

const login = async (userData) => {
  const response = await axios.post(`${base_url}user/login`, userData);

  if (response.data) {
    localStorage.setItem("customer", JSON.stringify(response.data));
  }
  return response.data;
};

const getUserWislist = async () => {
  const response = await axios.get(`${base_url}user/wishlist`, getConfig());
  if (response.data) {
    return response.data;
  }
};

const addToCart = async (cartData) => {
  const response = await axios.post(`${base_url}user/cart`, cartData, getConfig());
  if (response.data) {
    return response.data;
  }
};

const addBundleToCart = async ({ bundleId, selectedOptions }) => {
  const response = await axios.post(`${base_url}user/cart/bundle`, { bundleId, selectedOptions }, getConfig());
  if (response.data) {
    return response.data;
  }
};

const getCart = async (data) => {
  const response = await axios.get(`${base_url}user/cart`, getConfig());
  if (response.data) {
    return response.data;
  }
};

const removeProductFromCart = async (data) => {
  const response = await axios.delete(
    `${base_url}user/delete-product-cart/${data.id}`,

    data.config2
  );
  if (response.data) {
    return response.data;
  }
};

const updateProductFromCart = async (cartDetail) => {
  const response = await axios.delete(
    `${base_url}user/update-product-cart/${cartDetail.cartItemId}/${cartDetail.quantity}`,
    getConfig()
  );
  if (response.data) {
    return response.data;
  }
};

const createOrder = async (orderDetail) => {
  const response = await axios.post(
    `${base_url}user/cart/create-order/`,
    orderDetail,
    getConfig()
  );
  if (response.data) {
    return response.data;
  }
};

const getUserOrders = async ({ page = 1, limit = 10 } = {}) => {
  const response = await axios.get(
    `${base_url}user/getmyorders?page=${page}&limit=${limit}`,
    getConfig()
  );
  if (response.data) {
    return response.data;
  }
};

const getUserSingleOrder = async (id) => {
  const response = await axios.get(
    `${base_url}user/getmyorder/${id}`,
    getConfig()
  );
  if (response.data) {
    return response.data;
  }
};

const cancelOrder = async ({ id, cancelReason }) => {
  const response = await axios.put(
    `${base_url}user/cancel-order/${id}`,
    { cancelReason },
    getConfig()
  );
  return response.data;
};

const updateUser = async (data) => {
  const response = await axios.put(
    `${base_url}user/edit-user`,
    data.data,
    getConfig()
  );
  if (response.data) {
    return response.data;
  }
};

const forgotPasswordToken = async (data) => {
  const response = await axios.post(
    `${base_url}user/forgot-password-token`,
    data
  );

  if (response.data) {
    return response.data;
  }
};

const resetPass = async (data) => {
  const response = await axios.put(
    `${base_url}user/reset-password/${data.token}`,
    {
      password: data?.password,
    }
  );

  if (response.data) {
    return response.data;
  }
};

const emptyCart = async (data) => {
  const response = await axios.delete(`${base_url}user/empty-cart`, getConfig());

  if (response.data) {
    return response.data;
  }
};

// Referral functions
const getReferralCode = async () => {
  console.log("Fetching referral code...");
  const response = await axios.get(`${base_url}user/referral-code`, getConfig());
  console.log("Referral code response:", response.data);
  if (response.data) {
    return response.data;
  }
};

const getMyReferrals = async ({ page = 1, limit = 10 } = {}) => {
  console.log("Fetching my referrals...");
  const config = getConfig();
  console.log("Config being used:", config);
  const response = await axios.get(
    `${base_url}user/my-referrals?txnPage=${page}&txnLimit=${limit}`,
    config
  );
  console.log("My referrals response:", response.data);
  if (response.data) {
    return response.data;
  }
};

const applyReferralCode = async (referralCode) => {
  const response = await axios.post(
    `${base_url}user/apply-referral`,
    { referralCode },
    getConfig()
  );
  if (response.data) {
    return response.data;
  }
};

const getAddresses = async () => {
  const response = await axios.get(`${base_url}user/addresses`, getConfig());
  return response.data;
};

const addAddress = async (data) => {
  const response = await axios.post(`${base_url}user/addresses`, data, getConfig());
  return response.data;
};

const updateAddress = async ({ addrId, data }) => {
  const response = await axios.put(`${base_url}user/addresses/${addrId}`, data, getConfig());
  return response.data;
};

const deleteAddress = async (addrId) => {
  const response = await axios.delete(`${base_url}user/addresses/${addrId}`, getConfig());
  return response.data;
};

export const authService = {
  register,
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
