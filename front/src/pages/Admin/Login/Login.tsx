import React from "react";
import { Navigate, useNavigate } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/pages/Admin/Login/components/LoginForm/LoginForm";
import type { LoginFormValues } from "@/pages/Admin/Login/components/LoginForm/schema";
import styles from "@/pages/Admin/Login/Login.module.css";
import { AuthLoading } from "@/router/AuthLoading/AuthLoading";

export function Login() {
  const navigate = useNavigate();
  const { isLoading, login, user } = useAuth();
  const [submitError, setSubmitError] = React.useState<string>();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (user) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(values: LoginFormValues) {
    setSubmitError(undefined);

    try {
      await login(values);
      await navigate("/admin", { replace: true });
    } catch {
      setSubmitError("Не удалось выполнить вход. Проверьте данные и попробуйте ещё раз");
    }
  }

  return (
    <main className={styles.root}>
      <LoginForm onSubmit={handleSubmit} submitError={submitError} />
    </main>
  );
}
