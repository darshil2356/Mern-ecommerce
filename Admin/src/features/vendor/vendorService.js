import api from "../../utils/axiosconfig";

const getVendors = async () => (await api.get("vendor/")).data;
const createVendor = async (data) => (await api.post("vendor/", data)).data;
const deleteVendor = async (id) => (await api.delete(`vendor/${id}`)).data;

const vendorService = { getVendors, createVendor, deleteVendor };
export default vendorService;
