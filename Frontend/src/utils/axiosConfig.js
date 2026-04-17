export const base_url = process.env.REACT_APP_BASE_URL;

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

// Legacy alias — always calls getConfig() so token is always fresh
export const config = getConfig();
