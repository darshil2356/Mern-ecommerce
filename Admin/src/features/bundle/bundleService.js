import axios from "axios";
import { config } from "../../utils/axiosconfig";
import { base_url } from "../../utils/baseUrl";

// Get all bundles
const getBundles = async () => {
  const response = await axios.get(`${base_url}bundles/`, config);
  return response.data;
};

// Get active bundles for storefront
const getActiveBundles = async () => {
  const response = await axios.get(`${base_url}bundles/active`);
  return response.data;
};

// Get single bundle
const getBundle = async (id) => {
  const response = await axios.get(`${base_url}bundles/${id}`, config);
  return response.data;
};

// Get bundles for a specific product (frequently bought together)
const getBundlesForProduct = async (productId) => {
  const response = await axios.get(`${base_url}bundles/product/${productId}`);
  return response.data;
};

// Get bundle stats
const getBundleStats = async () => {
  const response = await axios.get(`${base_url}bundles/stats`, config);
  return response.data;
};

// Create new bundle
const createBundle = async (bundle) => {
  const response = await axios.post(`${base_url}bundles/`, bundle, config);
  return response.data;
};

// Update bundle
const updateBundle = async (bundle) => {
  const response = await axios.put(
    `${base_url}bundles/${bundle.id}`,
    bundle.bundleData,
    config
  );
  return response.data;
};

// Delete bundle
const deleteBundle = async (id) => {
  const response = await axios.delete(`${base_url}bundles/${id}`, config);
  return response.data;
};

const bundleService = {
  getBundles,
  getActiveBundles,
  getBundle,
  getBundlesForProduct,
  getBundleStats,
  createBundle,
  updateBundle,
  deleteBundle,
};

export default bundleService;

