import type { AuthUser } from "@/api/auth/schemas";
import type { LoginCredentials } from "@/auth/login";

export interface AuthContextValue {
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  user: AuthUser | null;
}
