import type { AuthUser } from "@/api/auth/schemas";

export interface AuthContextValue {
  isLoading: boolean;
  user: AuthUser | null;
}
