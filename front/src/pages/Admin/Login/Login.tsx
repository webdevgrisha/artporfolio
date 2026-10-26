import React from "react";
import { Navigate, useLocation } from "react-router";

import { documentTitle } from "@/config/documentTitle";
import { useAuth } from "@/hooks/useAuth";
import { adminHomePath } from "@/pages/Admin/config/pages";
import { LoginForm } from "@/pages/Admin/Login/components/LoginForm/LoginForm";
import type { LoginFormValues } from "@/pages/Admin/Login/components/LoginForm/schema";
import styles from "@/pages/Admin/Login/Login.module.css";
import { getLoginErrorMessage } from "@/pages/Admin/Login/utils/getLoginErrorMessage";
import { AuthLoading } from "@/router/AuthLoading/AuthLoading";
import utilities from "@/styles/utilities.module.css";

function getRedirectPath(state: unknown): string {
  if (typeof state === "object" && state !== null && "from" in state) {
    const { from } = state;

    // Only return to admin pages, never to an arbitrary path from history state.
    if (typeof from === "string" && from.startsWith("/admin/")) {
      return from;
    }
  }

  return adminHomePath;
}

export function Login() {
  const location = useLocation();
  const { isLoading, login, user } = useAuth();
  const [submitError, setSubmitError] = React.useState<string>();

  if (isLoading) {
    return <AuthLoading />;
  }

  if (user) {
    return <Navigate to={getRedirectPath(location.state)} replace />;
  }

  async function handleSubmit(values: LoginFormValues) {
    setSubmitError(undefined);

    try {
      // Updating the user re-renders this page, and the redirect above takes over.
      await login(values);
    } catch (error) {
      setSubmitError(getLoginErrorMessage(error));
    }
  }

  return (
    <main className={styles.root}>
      <title>{documentTitle("Вход")}</title>
      <h1 className={utilities.visuallyHidden}>Вход в админ-панель</h1>
      <LoginForm onSubmit={handleSubmit} submitError={submitError} />
    </main>
  );
}
