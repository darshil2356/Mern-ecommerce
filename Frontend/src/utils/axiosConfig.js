import axios from "axios";

export const base_url = process.env.REACT_APP_BASE_URL;

// Axios instance used for all authenticated requests
const axiosInstance = axios.create({ baseURL: base_url });

let isRefreshing = false;
let failedQueue = []; // queue requests that came in while refresh was in progress

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Attach fresh token before every request
axiosInstance.interceptors.request.use((config) => {
  const customer = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;
  if (customer?.token) {
    config.headers.Authorization = `Bearer ${customer.token}`;
  }
  config.headers.Accept = "application/json";
  return config;
});

// Handle 401 — try refresh, retry original request
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401, and don't retry refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/user/refresh")
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is in httpOnly cookie — backend reads it automatically
        const { data } = await axios.get(`${base_url}user/refresh`, {
          withCredentials: true,
        });

        const newToken = data.accessToken;

        // Update localStorage with new token
        const customer = localStorage.getItem("customer")
          ? JSON.parse(localStorage.getItem("customer"))
          : {};
        const updated = { ...customer, token: newToken };
        localStorage.setItem("customer", JSON.stringify(updated));
        localStorage.setItem("token", newToken);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — clear session and redirect to login
        localStorage.removeItem("customer");
        localStorage.removeItem("token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getConfig = () => {
  const customer = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;
  return {
    headers: {
      Authorization: `Bearer ${customer?.token || ""}`,
      Accept: "application/json",
    },
  };
};

// Legacy alias
export const config = getConfig;

export default axiosInstance;
