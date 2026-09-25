import React from "react";
import { useNavigate } from "react-router";

import { login } from "@/auth/login";
import { LoginForm } from "@/pages/Admin/Login/components/LoginForm/LoginForm";
import type { LoginFormValues } from "@/pages/Admin/Login/components/LoginForm/schema";
import styles from "@/pages/Admin/Login/Login.module.css";

export function Login() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = React.useState<string>();

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
