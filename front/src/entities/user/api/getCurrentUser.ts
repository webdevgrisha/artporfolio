import { http } from "@/shared/api/http";

import { type AuthUser, authUserSchema } from "../model/user";

export function getCurrentUser(): Promise<AuthUser> {
  return http.get({ path: "/auth/me", schema: authUserSchema });
}
