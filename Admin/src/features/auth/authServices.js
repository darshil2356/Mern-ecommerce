import api from "../../utils/axiosconfig";

const login = async (user) => {
  const response = await api.post("user/admin-login", user);
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

const getOrders = async () => {
  const response = await api.get("user/getallorders");
  return response.data;
};

const getOrder = async (id) => {
  const response = await api.get(`user/getaOrder/${id}`);
  return response.data;
};

const updateOrder = async (data) => {
  const response = await api.put(`user/updateOrder/${data.id}`, { status: data.status });
  return response.data;
};

const adminCancelOrder = async ({ id, cancelReason }) => {
  const response = await api.put(`user/admin-cancel-order/${id}`, { cancelReason });
  return response.data;
};

const getMonthlyOrders = async () => {
  const response = await api.get("user/getMonthWiseOrderIncome");
  return response.data;
};

const getDailySales = async (data) => {
  let url = "user/getDailySales";
  if (data && data.params) {
    url += `?${data.params}`;
  }
  const response = await api.get(url);
  return response.data;
};

const getDashboardStats = async (data) => {
  let url = "user/getDashboardStats";
  if (data && data.params) {
    url += `?${data.params}`;
  }
  const response = await api.get(url);
  return response.data;
};

const getYearlyStats = async () => {
  const response = await api.get("user/getyearlyorders");
  return response.data;
};

const getMonthlyReport = async (month, year, paymentFilter) => {
  let url = `reports/monthly?month=${month}&year=${year}`;
  if (paymentFilter) url += `&paymentFilter=${paymentFilter}`;
  const response = await api.get(url);
  return response.data;
};

const getYearlyReport = async (year, paymentFilter) => {
  let url = `reports/yearly?year=${year}`;
  if (paymentFilter) url += `&paymentFilter=${paymentFilter}`;
  const response = await api.get(url);
  return response.data;
};

const getDateRangeReport = async (startDate, endDate, paymentFilter) => {
  let url = `reports/date-range?startDate=${startDate}&endDate=${endDate}`;
  if (paymentFilter) url += `&paymentFilter=${paymentFilter}`;
  const response = await api.get(url);
  return response.data;
};

const getGSTReport = async (month, year, paymentFilter) => {
  let url = `reports/gst?month=${month}&year=${year}`;
  if (paymentFilter) url += `&paymentFilter=${paymentFilter}`;
  const response = await api.get(url);
  return response.data;
};

const getProductWiseReport = async (startDate, endDate, paymentFilter) => {
  let url = `reports/product-wise?startDate=${startDate}&endDate=${endDate}`;
  if (paymentFilter) url += `&paymentFilter=${paymentFilter}`;
  const response = await api.get(url);
  return response.data;
};

const getCustomerWiseReport = async (startDate, endDate, paymentFilter) => {
  let url = `reports/customer-wise?startDate=${startDate}&endDate=${endDate}`;
  if (paymentFilter) url += `&paymentFilter=${paymentFilter}`;
  const response = await api.get(url);
  return response.data;
};

const authService = {
  login,
  getOrders,
  getOrder,
  getMonthlyOrders,
  getDailySales,
  getDashboardStats,
  getYearlyStats,
  updateOrder,
  adminCancelOrder,
  getMonthlyReport,
  getYearlyReport,
  getDateRangeReport,
  getGSTReport,
  getProductWiseReport,
  getCustomerWiseReport,
};

export default authService;
