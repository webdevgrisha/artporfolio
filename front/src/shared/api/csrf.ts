import { z } from "zod";

import { http } from "./http";

const csrfResponseSchema = z.object({
  csrfToken: z.string().min(1),
});

/** A fresh token for the X-CSRF-Token header of a state-changing request. */
export async function getCsrfToken(): Promise<string> {
  const response = await http.get({
    path: "/auth/csrf",
    schema: csrfResponseSchema,
  });

  return response.csrfToken;
}
