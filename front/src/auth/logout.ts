import { endSession, getCsrfToken } from "@/api/auth";

export async function logout(): Promise<void> {
  const csrfToken = await getCsrfToken();

  await endSession({ csrfToken });
}
