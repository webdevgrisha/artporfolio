/** The session cookie of the signed-in admin; tests mock verifySession to accept it. */
export const adminSessionCookie = "admin_session=firebase-session";

/** Cookie and CSRF headers of a request from the signed-in admin. */
export async function adminHeaders(baseUrl: string): Promise<Record<string, string>> {
  const response = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: { Cookie: adminSessionCookie },
  });
  const { csrfToken } = (await response.json()) as { csrfToken: string };
  const csrfCookie = response.headers.get("set-cookie")?.split(";", 1)[0];

  return { Cookie: `${adminSessionCookie}; ${String(csrfCookie)}`, "X-CSRF-Token": csrfToken };
}
