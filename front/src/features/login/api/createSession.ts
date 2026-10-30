import { type AuthUser, authUserResponseSchema } from "@/entities/user";
import { http } from "@/shared/api/http";

interface CreateSessionParams {
  idToken: string;
}

export async function createSession({ idToken }: CreateSessionParams): Promise<AuthUser> {
  const response = await http.post({
    path: "/auth/login",
    body: { idToken },
    schema: authUserResponseSchema,
    // There is no session yet, so there is no CSRF token either.
    withCsrfToken: false,
  });

  return response.user;
}
