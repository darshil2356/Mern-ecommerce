import axios from "axios";
import { store } from "../app/store";
import { logout } from "../features/user/userSlice";

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const customer = localStorage.getItem("customer");
      // Only force logout if user was actually logged in
      if (customer) {
        localStorage.removeItem("customer");
        localStorage.removeItem("token");
        store.dispatch(logout());
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);
