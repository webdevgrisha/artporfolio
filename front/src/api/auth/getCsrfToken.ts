import { z } from "zod";

import { http } from "@/http/http";

const csrfResponseSchema = z.object({
  csrfToken: z.string().min(1),
});

export async function getCsrfToken(): Promise<string> {
  const response = await http.get({
    path: "/auth/csrf",
    schema: csrfResponseSchema,
  });

  return response.csrfToken;
}
