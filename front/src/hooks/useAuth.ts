import React from "react";

import { AuthContext } from "@/contexts/Auth/AuthContext";
import type { AuthContextValue } from "@/contexts/Auth/types";

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
