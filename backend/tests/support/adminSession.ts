/** The session cookie of the signed-in admin; tests mock verifySession to accept it. */
export const adminSessionCookie = "__session=firebase-session";

/** Cookie and CSRF headers of a request from the signed-in admin. */
export async function adminHeaders(baseUrl: string): Promise<Record<string, string>> {
  const response = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: { Cookie: adminSessionCookie },
  });
  const { csrfToken } = (await response.json()) as { csrfToken: string };

  return { Cookie: adminSessionCookie, "X-CSRF-Token": csrfToken };
}
