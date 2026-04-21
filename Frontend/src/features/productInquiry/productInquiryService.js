import axios from "axios";
import { base_url } from "../../utils/axiosConfig";

const submitInquiry = async (data) => {
  const customer = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;
  const headers = { Accept: "application/json" };
  if (customer?.token) headers.Authorization = `Bearer ${customer.token}`;
  const response = await axios.post(`${base_url}product-inquiry`, data, { headers });
  return response.data;
};

const productInquiryService = { submitInquiry };
export default productInquiryService;
