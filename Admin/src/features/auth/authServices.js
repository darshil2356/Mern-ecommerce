import axios from "axios";
import { config } from "../../utils/axiosconfig";
import { base_url } from "../../utils/baseUrl";

// const getTokenFromLocalStorage = localStorage.get("user")
//   ? JSON.parse(localStorage.getItem("user"))
//   : null;

const login = async (user) => {
  const response = await axios.post(`${base_url}user/admin-login`, user);
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};
// const getOrders = async (data) => {
//   const response = await axios.get(`${base_url}user/getallorders`, data);

//   return response.data;
// };

const getOrders = async () => {
  const response = await axios.get(
    `${base_url}user/getallorders`,
    config   // ✅ token goes here
  );

  return response.data;
};


const getOrder = async (id) => {
  const response = await axios.get(
    `${base_url}user/getaOrder/${id}`,

    config
  );

  return response.data;
};

const updateOrder = async (data) => {
  const response = await axios.put(
    `${base_url}user/updateOrder/${data.id}`,
    { status: data.status },
    config
  );

  return response.data;
};

const getMonthlyOrders = async (data) => {
  const response = await axios.get(
    `${base_url}user/getMonthWiseOrderIncome`,

    data
  );

  return response.data;
};

const getDailySales = async (data) => {
  const response = await axios.get(
    `${base_url}user/getDailySales`,
    data
  );

  return response.data;
};

const getDashboardStats = async (data) => {
  const response = await axios.get(
    `${base_url}user/getDashboardStats`,
    data
  );

  return response.data;
};

const getYearlyStats = async (data) => {
  const response = await axios.get(
    `${base_url}user/getyearlyorders`,

    data
  );

  return response.data;
};

const getMonthlyReport = async (month, year) => {
  const response = await axios.get(
    `${base_url}reports/monthly?month=${month}&year=${year}`,
    config
  );
  return response.data;
};

const getYearlyReport = async (year) => {
  const response = await axios.get(
    `${base_url}reports/yearly?year=${year}`,
    config
  );
  return response.data;
};

const getDateRangeReport = async (startDate, endDate) => {
  const response = await axios.get(
    `${base_url}reports/date-range?startDate=${startDate}&endDate=${endDate}`,
    config
  );
  return response.data;
};

const getGSTReport = async (month, year) => {
  const response = await axios.get(
    `${base_url}reports/gst?month=${month}&year=${year}`,
    config
  );
  return response.data;
};

const getProductWiseReport = async (startDate, endDate) => {
  const response = await axios.get(
    `${base_url}reports/product-wise?startDate=${startDate}&endDate=${endDate}`,
    config
  );
  return response.data;
};

const getCustomerWiseReport = async (startDate, endDate) => {
  const response = await axios.get(
    `${base_url}reports/customer-wise?startDate=${startDate}&endDate=${endDate}`,
    config
  );
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
  getMonthlyReport,
  getYearlyReport,
  getDateRangeReport,
  getGSTReport,
  getProductWiseReport,
  getCustomerWiseReport,
};

export default authService;
