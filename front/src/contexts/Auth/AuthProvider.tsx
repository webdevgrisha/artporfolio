import React, { type ReactNode } from "react";

import { getCurrentUser } from "@/api/auth";
import type { AuthUser } from "@/api/auth/schemas";
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

  return <AuthContext.Provider value={{ isLoading, user }}>{children}</AuthContext.Provider>;
}
