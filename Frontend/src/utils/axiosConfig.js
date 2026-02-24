export const base_url = "http://localhost:8000/api/";
// export const base_url = "https://mern-ecommerce-backend-g29n.onrender.com/api/";

// Function to get config with fresh token each time
export const getConfig = () => {
  const getTokenFromLocalStorage = localStorage.getItem("customer")
    ? JSON.parse(localStorage.getItem("customer"))
    : null;
  return {
    headers: {
      Authorization: `Bearer ${
        getTokenFromLocalStorage !== null ? getTokenFromLocalStorage.token : ""
      }`,
      Accept: "application/json",
    },
  };
};

// Legacy export for backward compatibility - will use stale token
export const config = {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("customer") ? JSON.parse(localStorage.getItem("customer")).token : ""}`,
    Accept: "application/json",
  },
};
