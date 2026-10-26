import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { AuthLoading } from "@/router/AuthLoading/AuthLoading";

export function RequireAuth() {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
