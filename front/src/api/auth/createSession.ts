import { type AuthUser, createSessionResponseSchema } from "@/api/auth/schema";
import { http } from "@/http/http";

interface CreateSessionParams {
  csrfToken: string;
  idToken: string;
}

export async function createSession({
  csrfToken,
  idToken,
}: CreateSessionParams): Promise<AuthUser> {
  const response = await http.post({
    path: "/auth/login",
    body: { idToken },
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: createSessionResponseSchema,
  });

  return response.user;
}
