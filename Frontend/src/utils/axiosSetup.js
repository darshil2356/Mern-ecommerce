import axios from "axios";
import { store } from "../app/store";
import { logout } from "../features/user/userSlice";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("customer");
      localStorage.removeItem("token");
      store.dispatch(logout());
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);
