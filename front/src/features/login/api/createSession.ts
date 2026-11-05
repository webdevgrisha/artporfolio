import { type AuthUser, authUserSchema } from "@/entities/user";
import { http } from "@/shared/api/http";

interface CreateSessionParams {
  idToken: string;
}

export function createSession({ idToken }: CreateSessionParams): Promise<AuthUser> {
  return http.post({
    path: "/auth/login",
    body: { idToken },
    schema: authUserSchema,
    // There is no session yet, so there is no CSRF token either.
    withCsrfToken: false,
  });
}
