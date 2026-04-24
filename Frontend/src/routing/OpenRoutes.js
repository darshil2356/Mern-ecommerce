import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export const OpenRoutes = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const token = user?.token;
  if (token) return <Navigate to="/" replace={true} />;
  return children;
};
