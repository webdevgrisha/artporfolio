import { redirect } from "react-router";

import { getCsrfToken } from "@/shared/api/csrf";
import { routes } from "@/shared/config/routes";

import { endSession } from "../api/sessionApi";

export async function logout(): Promise<void> {
  const csrfToken = await getCsrfToken();

  await endSession({ csrfToken });
}

/** Route action for the logout form. */
export async function logoutAction() {
  try {
    await logout();
  } catch {
    // The server clears the session cookie before revoking it, so the user is signed out anyway.
  }

  return redirect(routes.login);
}
