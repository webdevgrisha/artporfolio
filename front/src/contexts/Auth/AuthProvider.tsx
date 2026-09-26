import React, { type ReactNode } from "react";

import { getCurrentUser } from "@/api/auth";
import type { AuthUser } from "@/api/auth/schemas";
import { login as authenticate, type LoginCredentials } from "@/auth/login";
import { logout as endAuthentication } from "@/auth/logout";
import { AuthContext } from "@/contexts/Auth/AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();

    getCurrentUser({ signal: controller.signal })
      .then((currentUser) => {
        if (!controller.signal.aborted) {
          setUser(currentUser);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  async function login(credentials: LoginCredentials): Promise<void> {
    const authenticatedUser = await authenticate(credentials);

    setUser(authenticatedUser);
  }

  async function logout(): Promise<void> {
    await endAuthentication();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ isLoading, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}
