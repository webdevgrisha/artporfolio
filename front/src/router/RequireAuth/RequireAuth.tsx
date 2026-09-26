import { Navigate, Outlet } from "react-router";

import { Spinner } from "@/components/Spinner/Spinner";
import { useAuth } from "@/hooks/useAuth";
import styles from "@/router/RequireAuth/RequireAuth.module.css";

export function RequireAuth() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <main className={styles.loading}>
        <Spinner label="Проверка авторизации" />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
