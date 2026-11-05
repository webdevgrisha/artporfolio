import { http } from "@/shared/api/http";

import { type AuthUser, authUserSchema } from "../model/user";

interface GetCurrentUserParams {
  /** Cancels the request, e.g. when the route loader is no longer needed. */
  signal: AbortSignal;
}

export function getCurrentUser({ signal }: GetCurrentUserParams): Promise<AuthUser> {
  return http.get({ path: "/auth/me", schema: authUserSchema, signal });
}
