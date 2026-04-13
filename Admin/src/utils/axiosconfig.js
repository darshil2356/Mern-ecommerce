import axios from "axios";

export const base_url = process.env.REACT_APP_API_URL ;

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
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((req) => {
  const token = getTokenFromLocalStorage();
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      window.location.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default api;


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
