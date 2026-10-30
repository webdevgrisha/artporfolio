import { type ActionFunctionArgs, redirect, replace } from "react-router";

import { getCurrentUser } from "@/entities/user";
import { getRequestErrorMessage } from "@/shared/api/getRequestErrorMessage";
import { http } from "@/shared/api/http";
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

/** Whether the browser still has a session: the API answers 401 without one. */
async function hasSession(signal: AbortSignal): Promise<boolean> {
  try {
    await getCurrentUser({ signal });
    return true;
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) return false;
    throw error;
  }
}

/**
 * Ends the session. Rejects while the session may still be there: the request was refused, never
 * reached the server, or the session could not be checked after a server error.
 */
async function logout(signal: AbortSignal): Promise<void> {
  try {
    await endSession();
  } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    // The API gives no CSRF token without a session cookie: the user is already signed out.
    if (error.status === 401) return;
    if (error.status < 500) throw error;
    // The server clears the session cookie before it revokes the session, so an error while
    // revoking still signs this browser out. A proxy may answer with an error before the server
    // is reached, though, and then the session stays: only the session itself tells which.
    if (await hasSession(signal)) throw error;
  }
}

/** Route action for the logout form. */
export async function logoutAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    await logout(request.signal);
  } catch (error) {
    showErrorToast(getRequestErrorMessage(error, "Не удалось выйти. Попробуйте ещё раз"), {
      id: logoutToastId,
    });

    // The user is still signed in, so they stay on their page; the page keeps its state.
    return replace(getReturnPath(formData.get(returnToField)));
  }

  // The data of the session stays in the tab no longer than the session.
  queryClient.clear();
  http.forgetCsrfToken();

  return redirect(routes.login);
}
