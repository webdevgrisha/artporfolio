import React from "react";
import { useNavigate } from "react-router";

import { useAuth } from "@/hooks/useAuth";
import { loginPath } from "@/pages/Admin/config/pages";

export function useAdminLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  async function logoutAdmin() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();
    } catch {
      // The local session is already cleared; the redirect below is still correct.
    }

    await navigate(loginPath, { replace: true });
  }

  return { isLoggingOut, logoutAdmin };
}
