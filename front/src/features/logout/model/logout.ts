import { type ActionFunctionArgs, redirect, replace } from "react-router";

import { getCsrfToken } from "@/shared/api/csrf";
import { getRequestErrorMessage } from "@/shared/api/getRequestErrorMessage";
import { HttpError } from "@/shared/api/httpError";
import { queryClient } from "@/shared/api/queryClient";
import { adminHomePath, routes } from "@/shared/config/routes";
import { showErrorToast } from "@/shared/ui/toast";

import { endSession } from "../api/sessionApi";

/** The form field with the page the logout was sent from. */
export const returnToField = "returnTo";

// One toast for a failed logout: a repeated failure replaces the previous one.
const logoutToastId = "logout";

function getReturnPath(value: FormDataEntryValue | null): string {
  // Only back to an admin page, never to an arbitrary URL from the form.
  return typeof value === "string" && value.startsWith("/admin/") ? value : adminHomePath;
}

/**
 * Ends the session. The server clears the session cookie before it revokes the session, so a
 * server error while revoking still signs the user out. Rejects when the request was refused or
 * never reached the server: then the session is still there.
 */
async function logout(): Promise<void> {
  const csrfToken = await getCsrfToken();

  try {
    await endSession({ csrfToken });
  } catch (error) {
    if (!(error instanceof HttpError && error.status >= 500)) throw error;
  }
}

/** Route action for the logout form. */
export async function logoutAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    await logout();
  } catch (error) {
    showErrorToast(getRequestErrorMessage(error, "Не удалось выйти. Попробуйте ещё раз"), {
      id: logoutToastId,
    });

    // The user is still signed in, so they stay on their page; the page keeps its state.
    return replace(getReturnPath(formData.get(returnToField)));
  }

  // The data of the session stays in the tab no longer than the session.
  queryClient.clear();

  return redirect(routes.login);
}
