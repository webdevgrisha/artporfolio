import { http } from "@/shared/api/http";

import { type AuthUser, authUserResponseSchema } from "../model/user";

interface GetCurrentUserParams {
  /** Cancels the request, e.g. when the route loader is no longer needed. */
  signal: AbortSignal;
}

export async function getCurrentUser({ signal }: GetCurrentUserParams): Promise<AuthUser> {
  const response = await http.get({
    path: "/auth/me",
    schema: authUserResponseSchema,
    signal,
  });

  return response.user;
}
