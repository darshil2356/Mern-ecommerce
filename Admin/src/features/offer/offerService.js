import api from "../../utils/axiosconfig";

const getOffers = async () => (await api.get("offers/")).data;
const createOffer = async (data) => (await api.post("offers/", data)).data;
const getOffer = async (id) => (await api.get(`offers/${id}`)).data;
const updateOffer = async ({ id, data }) => (await api.put(`offers/${id}`, data)).data;
const deleteOffer = async (id) => (await api.delete(`offers/${id}`)).data;

const offerService = { getOffers, createOffer, getOffer, updateOffer, deleteOffer };
export default offerService;
