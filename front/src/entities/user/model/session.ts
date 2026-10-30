import { type LoaderFunctionArgs, redirect, useRouteLoaderData } from "react-router";

import { HttpError } from "@/shared/api/httpError";
import { adminRouteId, routes } from "@/shared/config/routes";

import { getCurrentUser } from "../api/getCurrentUser";
import type { AuthUser } from "./user";

/**
 * Loader of the admin layout route: without a valid session the user is sent to the login page,
 * which brings them back here. Any other failure, such as no connection, is an error of the page:
 * signing in again would not help.
 */
export async function requireSession({ request }: LoaderFunctionArgs): Promise<AuthUser> {
  try {
    return await getCurrentUser({ signal: request.signal });
  } catch (error) {
    if (!(error instanceof HttpError && error.status === 401)) throw error;

    const { pathname, search } = new URL(request.url);
    const redirectTo = `${pathname}${search}`;
    throw redirect(`${routes.login}?${new URLSearchParams({ redirectTo }).toString()}`);
  }
}

/** The signed-in user. Available anywhere inside the admin layout route. */
export function useSessionUser(): AuthUser {
  const user = useRouteLoaderData<typeof requireSession>(adminRouteId);

  if (!user) {
    throw new Error("useSessionUser must be used inside the admin layout route");
  }

  return user;
}
