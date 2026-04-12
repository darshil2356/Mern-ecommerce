import api from "../../utils/axiosconfig";
const getBrands = async () => {
  const response = await api.get("brand/");

  return response.data;
};

const createBrand = async (brand) => {
  const response = await api.post("brand/", brand);

  return response.data;
};
const updateBrand = async (brand) => {
  const response = await api.put(
    `brand/${brand.id}`,
    { title: brand.brandData.title },
  );

  return response.data;
};
const getBrand = async (id) => {
  const response = await api.get(`brand/${id}`);

  return response.data;
};

const deleteBrand = async (id) => {
  const response = await api.delete(`brand/${id}`);

  return response.data;
};

const brandService = {
  getBrands,
  createBrand,
  getBrand,
  updateBrand,
  deleteBrand,
};

export default brandService;
