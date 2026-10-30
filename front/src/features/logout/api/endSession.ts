import { http } from "@/shared/api/http";

export async function endSession(): Promise<void> {
  await http.postVoid({
    path: "/auth/logout",
  });
}
