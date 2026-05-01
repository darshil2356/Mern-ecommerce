import axios from "axios";
import { base_url, getConfig } from "../../utils/axiosConfig";
import { cachedFetch } from "../../utils/apiCache";

const getProducts = async (data = {}) => {
  const response = await axios.get(`${base_url}product`, {
    params: {
      ...(data.tag && { tags: data.tag }),
      ...(data.brand && { brand: data.brand }),
      ...(data.category && { category: data.category }),
      ...(data.minPrice && { "price[gte]": data.minPrice }),
      ...(data.maxPrice && { "price[lte]": data.maxPrice }),
      ...(data.sort && { sort: data.sort }),
      limit: data.limit || 40,
      store: "true",
    },
  });
  return response.data;
};

const getSingleProduct = async (id) => {
  const response = await axios.get(`${base_url}product/${id}`);
  if (response.data) return response.data;
};

const addToWishlist = async (prodId) => {
  const response = await axios.put(`${base_url}product/Wishlist`, { prodId }, getConfig());
  if (response.data) return response.data;
};

const rateProduct = async (data) => {
  const response = await axios.put(`${base_url}product/rating`, data, getConfig());
  if (response.data) return response.data;
};

const getCategoryTree = async () => {
  return cachedFetch(
    "category/tree",
    () => axios.get(`${base_url}category/tree`).then((r) => r.data),
    60 * 60 * 1000
  );
};

export const productSevice = {
  getProducts,
  addToWishlist,
  getSingleProduct,
  rateProduct,
  getCategoryTree,
};
