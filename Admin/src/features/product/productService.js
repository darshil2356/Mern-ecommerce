import api from "../../utils/axiosconfig";

const getProducts = async () => {
  const response = await api.get("product/");

  return response.data;
};
const createProduct = async (product) => {
  const response = await api.post("product/", product);

  return response.data;
};

const getProduct = async (id) => {
  const response = await api.get(`product/${id}`);

  return response.data;
};

const updateProduct = async (product) => {
  const response = await api.put(
    `product/${product.id}`,
    product.productData,
  );

  return response.data;
};

const deleteproduct = async (id) => {
  const response = await api.delete(`product/${id}`);

  return response.data;
};

const productService = {
  getProducts,
  createProduct,
  deleteproduct,
  updateProduct,
  getProduct,
};

export default productService;
