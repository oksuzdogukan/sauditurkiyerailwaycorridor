import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  if (!token) {
    // User is not authenticated; redirect to login
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    // User does not have the required role; redirect to login or default
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and authorized; render content
  return children;
}
