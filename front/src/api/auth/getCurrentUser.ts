import { type AuthUser, authUserResponseSchema } from "@/api/auth/schemas";
import { http } from "@/http/http";

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await http.get({
    path: "/auth/me",
    schema: authUserResponseSchema,
  });

  return response.user;
}
