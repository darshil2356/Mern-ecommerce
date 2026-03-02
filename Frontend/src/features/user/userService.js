import axios from "axios";
import { base_url, config, getConfig } from "../../utils/axiosConfig";

const register = async (userData) => {
  const response = await axios.post(`${base_url}user/register`, userData);
  if (response.data) {
    return response.data;
  }
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

const getUserOrders = async () => {
  const response = await axios.get(`${base_url}user/getmyorders`, getConfig());

  if (response.data) {
    return response.data;
  }
};

const updateUser = async (data) => {
  const response = await axios.put(
    `${base_url}user/edit-user`,
    data.data,
    data.config2,
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

const getMyReferrals = async () => {
  console.log("Fetching my referrals...");
  const config = getConfig();
  console.log("Config being used:", config);
  const response = await axios.get(`${base_url}user/my-referrals`, config);
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

export const authService = {
  register,
  login,
  getUserWislist,
  addToCart,
  getCart,
  removeProductFromCart,
  updateProductFromCart,
  createOrder,
  getUserOrders,
  updateUser,
  forgotPasswordToken,
  resetPass,
  emptyCart,
  getReferralCode,
  getMyReferrals,
  applyReferralCode,
};
