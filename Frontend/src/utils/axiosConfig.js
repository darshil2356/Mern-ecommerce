import axios from "axios";

export const base_url = process.env.REACT_APP_BASE_URL;

// Axios instance used for all authenticated requests
const axiosInstance = axios.create({ baseURL: base_url });

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const clearSessionAndLogout = () => {
  localStorage.removeItem("customer");
  localStorage.removeItem("token");
  // Lazy import to break circular dependency: axiosConfig → store → productSlice → productService → axiosConfig
  import("../app/store").then(({ store }) => {
    import("../features/user/userSlice").then(({ logout }) => {
      store.dispatch(logout());
    });
  });
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

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("user/refresh")
    ) {
      if (isRefreshing) {
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
        const { data } = await axios.get(`${base_url}user/refresh`, {
          withCredentials: true,
        });

        const newToken = data.accessToken;
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
        clearSessionAndLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For non-retried 401s (e.g. refresh endpoint itself failed) — already handled above
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
