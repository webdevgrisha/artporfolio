import { type LoaderFunctionArgs, redirect } from "react-router";

import { getCurrentUser } from "@/api/auth";
import type { AuthUser } from "@/api/auth/schemas";
import { loginPath } from "@/pages/Admin/config/pages";

/** Guards every admin page: without a valid session the user is sent to the login page. */
export async function adminLayoutLoader({ request }: LoaderFunctionArgs): Promise<AuthUser> {
  try {
    return await getCurrentUser({ signal: request.signal });
  } catch {
    const redirectTo = new URL(request.url).pathname;
    throw redirect(`${loginPath}?${new URLSearchParams({ redirectTo }).toString()}`);
  }
}
