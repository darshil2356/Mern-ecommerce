import api from "../../utils/axiosconfig";

const createAudit = async (data) => {
  const response = await api.post("stock-audit/create", data);
  return response.data;
};

const getAllAudits = async (params = {}) => {
  const response = await api.get("stock-audit/", { params });
  return response.data;
};

const getAuditById = async (id) => {
  const response = await api.get(`stock-audit/${id}`);
  return response.data;
};

const updateItemCount = async (id, data) => {
  const response = await api.put(`stock-audit/${id}/count`, data);
  return response.data;
};

const batchUpdateCounts = async (id, data) => {
  const response = await api.put(`stock-audit/${id}/batch-counts`, data);
  return response.data;
};

const updateItemInvestigation = async (id, itemId, data) => {
  const response = await api.put(`stock-audit/${id}/items/${itemId}/investigation`, data);
  return response.data;
};

const reconcileAudit = async (id, data = {}) => {
  const response = await api.post(`stock-audit/${id}/reconcile`, data);
  return response.data;
};

const deleteAudit = async (id) => {
  const response = await api.delete(`stock-audit/${id}`);
  return response.data;
};

const stockAuditService = {
  createAudit,
  getAllAudits,
  getAuditById,
  updateItemCount,
  batchUpdateCounts,
  updateItemInvestigation,
  reconcileAudit,
  deleteAudit,
};

export default stockAuditService;
