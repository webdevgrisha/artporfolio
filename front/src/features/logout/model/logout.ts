import { redirect } from "react-router";

import { getCsrfToken } from "@/shared/api/csrf";
import { queryClient } from "@/shared/api/queryClient";
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

  // The data of the session stays in the tab no longer than the session.
  queryClient.clear();

  return redirect(routes.login);
}
