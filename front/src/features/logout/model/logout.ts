import { redirect } from "react-router";

import { endSession, getCsrfToken } from "@/api/auth";
import { loginPath } from "@/pages/Admin/config/pages";

export async function logout(): Promise<void> {
  const csrfToken = await getCsrfToken();

  await endSession({ csrfToken });
}

export async function logoutAction() {
  try {
    await logout();
  } catch {
    // The server clears the session cookie before revoking it, so the user is signed out anyway.
  }

  return redirect(loginPath);
}
