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
    {
      title: product.productData.title,
      description: product.productData.description,
      price: product.productData.price,
      brand: product.productData.brand,
      hsnCode: product.productData.hsnCode,
      // quantity: product.productData.quantity,
      category: product.productData.category,
      tags: product.productData.tags,
      color: product.productData.color,
      variants: product.productData.variants || [],
      //  size: product.productData.size,   // 👈 ADD THIS
      images: product.productData.images,
       inventory: product.productData.inventory,
      videos: product.productData.videos,               // ✅ ALSO ADD (you use videos)

      sizeStock: product.productData.sizeStock,
      hsnCode: product.productData.hsnCode,
      reelUrl: product.productData.reelUrl || null,
    },
    
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
