import axios from "axios";
import { base_url, config, getConfig } from "../../utils/axiosConfig";

// const getProducts = async (data) => {
//   console.log(data);
//   const response = await axios.get(
//     `${base_url}product?${data?.brand ? `brand=${data?.brand}&&` : ""}${
//       data?.tag ? `tags=${data?.tag}&&` : ""
//     }${data?.category ? `category=${data?.category}&&` : ""}${
//       data?.minPrice ? `price[gte]=${data?.minPrice}&&` : ""
//     }${data?.maxPrice ? `price[lte]=${data?.maxPrice}&&` : ""}${
//       data?.sort ? `sort=${data?.sort}&&` : ""
//     }`
//   );

//   if (response.data) {
//     return response.data;
//   }
// };
const getProducts = async (data = {}) => {
  const response = await axios.get(`${base_url}product`, {
    params: {
      ...(data.tag && { tags: data.tag }),
      ...(data.category && { category: data.category }),
      ...(data.minPrice && { "price[gte]": data.minPrice }),
      ...(data.maxPrice && { "price[lte]": data.maxPrice }),
      ...(data.sort && { sort: data.sort }),
      limit: data.limit || 200,
      store: "true",
    },
  });

  return response.data;
};


const getSingleProduct = async (id) => {
  const response = await axios.get(`${base_url}product/${id}`);
  if (response.data) {
    return response.data;
  }
};

const addToWishlist = async (prodId) => {
  const response = await axios.put(
    `${base_url}product/Wishlist`,
    { prodId },
    getConfig()
  );
  if (response.data) {
    return response.data;
  }
};

const rateProduct = async (data) => {
  const response = await axios.put(`${base_url}product/rating`, data, getConfig());
  if (response.data) {
    return response.data;
  }
};

export const productSevice = {
  getProducts,
  addToWishlist,
  getSingleProduct,
  rateProduct,
};
