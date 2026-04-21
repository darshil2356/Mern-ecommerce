import axios from "axios";
import { config } from "../../utils/axiosconfig";
import { base_url } from "../../utils/baseUrl";

const getAllInquiries = async () => {
  const res = await axios.get(`${base_url}product-inquiry`, config);
  return res.data;
};

const getInquiriesByProduct = async (productId) => {
  const res = await axios.get(`${base_url}product-inquiry/product/${productId}`, config);
  return res.data;
};

const updateInquiryStatus = async ({ id, status }) => {
  const res = await axios.put(`${base_url}product-inquiry/${id}`, { status }, config);
  return res.data;
};

const deleteInquiry = async (id) => {
  const res = await axios.delete(`${base_url}product-inquiry/${id}`, config);
  return res.data;
};

const notifyRestocked = async (productId) => {
  const res = await axios.post(`${base_url}product-inquiry/notify/${productId}`, {}, config);
  return res.data;
};

const productInquiryService = {
  getAllInquiries,
  getInquiriesByProduct,
  updateInquiryStatus,
  deleteInquiry,
  notifyRestocked,
};

export default productInquiryService;
