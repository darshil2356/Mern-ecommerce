import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export const PrivateRoutes = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const token = user?.token;
  if (!token) return <Navigate to="/login" replace={true} />;
  return children;
};
