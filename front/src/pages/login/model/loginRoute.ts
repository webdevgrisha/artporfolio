import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";

import { getCurrentUser } from "@/entities/user";
import { getLoginErrorMessage, login, loginSchema } from "@/features/login";
import { adminHomePath } from "@/shared/config/routes";

export const redirectToField = "redirectTo";

function getRedirectPath(value: FormDataEntryValue | null): string {
  // Only return to admin pages, never to an arbitrary URL from the query string.
  return typeof value === "string" && value.startsWith("/admin/") ? value : adminHomePath;
}

export async function loginLoader({ request }: LoaderFunctionArgs) {
  const user = await getCurrentUser({ signal: request.signal }).catch(() => null);

  if (user) {
    throw redirect(getRedirectPath(new URL(request.url).searchParams.get(redirectToField)));
  }

  return null;
}

export async function loginAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const credentials = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!credentials.success) {
    return { error: getLoginErrorMessage(credentials.error) };
  }

  try {
    await login(credentials.data);
  } catch (error) {
    return { error: getLoginErrorMessage(error) };
  }

  return redirect(getRedirectPath(formData.get(redirectToField)));
}
