import { Navigate, Outlet } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { AuthLoading } from "@/router/AuthLoading/AuthLoading";

export function RequireAuth() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
