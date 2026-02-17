import axios from "axios";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.replace("/");
    }
    return Promise.reject(error);
  }
);