import React from "react";

import type { AuthContextValue } from "@/contexts/Auth/types";

export const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);
