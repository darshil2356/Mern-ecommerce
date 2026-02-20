export const getTokenFromLocalStorage = () => localStorage.getItem("user")
  ? JSON.parse(localStorage.getItem("user"))
  : null;

export const config = {
  headers: {
    Authorization: `Bearer ${
      getTokenFromLocalStorage() !== null ? getTokenFromLocalStorage()?.token : ""
    }`,
    Accept: "application/json",
  },
};


// import axios from "axios";

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API_URL,
//   headers: {
//     Accept: "application/json",
//   },
// });

// api.interceptors.request.use((req) => {
//   const user = localStorage.getItem("user");
//   if (user) {
//     const { token } = JSON.parse(user);
//     req.headers.Authorization = `Bearer ${token}`;
//   }
//   return req;
// });

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("user");
//       window.location.replace("/login");
//     }
//     return Promise.reject(error);
//   }
// );

// /* 🔥 COMPATIBILITY LAYER — THIS FIXES EVERYTHING */
// export const config = {
//   headers: {
//     Accept: "application/json",
//   },
// };

// export default api;
