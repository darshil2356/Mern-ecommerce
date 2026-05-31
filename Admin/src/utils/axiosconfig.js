import axios from "axios";

export const base_url = process.env.REACT_APP_API_URL;

export const getTokenFromLocalStorage = () => {
  const persisted = localStorage.getItem("user");
  return persisted ? JSON.parse(persisted).token : "";
};

export const getConfig = () => ({
  headers: {
    Authorization: `Bearer ${getTokenFromLocalStorage()}`,
    Accept: "application/json",
  },
});

export const config = {
  get headers() {
    return {
      Authorization: `Bearer ${getTokenFromLocalStorage()}`,
      Accept: "application/json",
    };
  },
};

const api = axios.create({
  baseURL: base_url,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// Attach fresh token before every request
api.interceptors.request.use((req) => {
  const token = getTokenFromLocalStorage();
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// On 401 — try refresh, retry original; if refresh fails → logout
api.interceptors.response.use(
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
            return api(originalRequest);
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

        // Update stored admin user with new token
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem("user", JSON.stringify({ ...parsed, token: newToken }));
        }

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("user");
        window.location.replace("/");
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
