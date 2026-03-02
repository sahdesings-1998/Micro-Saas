import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleHome = (role) => {
  if (role === "superadmin") return "/superadmin";
  if (role === "admin") return "/admin";
  return "/member";
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
