import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";

import { getCurrentUser } from "@/api/auth";
import { login } from "@/auth/login";
import { adminHomePath } from "@/pages/Admin/config/pages";
import { loginSchema } from "@/pages/Admin/Login/components/LoginForm/schema";
import { getLoginErrorMessage } from "@/pages/Admin/Login/utils/getLoginErrorMessage";

const redirectToField = "redirectTo";

function getRedirectPath(value: FormDataEntryValue | null): string {
  // Only return to admin pages, never to an arbitrary URL from the query string.
  return typeof value === "string" && value.startsWith("/admin/") ? value : adminHomePath;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getCurrentUser({ signal: request.signal }).catch(() => null);

  if (user) {
    throw redirect(getRedirectPath(new URL(request.url).searchParams.get(redirectToField)));
  }

  return null;
}

export async function action({ request }: ActionFunctionArgs) {
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

export { redirectToField };
