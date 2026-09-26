import { http } from "@/http/http";

interface EndSessionParams {
  csrfToken: string;
}

export async function endSession({ csrfToken }: EndSessionParams): Promise<void> {
  await http.postVoid({
    path: "/auth/logout",
    headers: {
      "X-CSRF-Token": csrfToken,
    },
  });
}
