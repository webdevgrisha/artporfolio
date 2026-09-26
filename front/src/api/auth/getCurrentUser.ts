import { type AuthUser, authUserResponseSchema } from "@/api/auth/schemas";
import { http } from "@/http/http";

interface GetCurrentUserParams {
  signal?: AbortSignal;
}

export async function getCurrentUser({ signal }: GetCurrentUserParams = {}): Promise<AuthUser> {
  const response = await http.get({
    path: "/auth/me",
    schema: authUserResponseSchema,
    signal,
  });

  return response.user;
}
