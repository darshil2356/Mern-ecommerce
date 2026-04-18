import api from "../../utils/axiosconfig";

const getSizes = async () => (await api.get("size/")).data;
const createSize = async (data) => (await api.post("size/", data)).data;
const updateSize = async ({ id, title }) => (await api.put(`size/${id}`, { title })).data;
const getSize = async (id) => (await api.get(`size/${id}`)).data;
const deleteSize = async (id) => (await api.delete(`size/${id}`)).data;

const sizeService = { getSizes, createSize, updateSize, getSize, deleteSize };
export default sizeService;
