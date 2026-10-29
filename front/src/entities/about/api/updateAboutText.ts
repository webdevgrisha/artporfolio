import { http } from "@/shared/api/http";

import { type AboutText, aboutTextResponseSchema } from "../model/aboutText";

interface UpdateAboutTextParams {
  csrfToken: string;
  text: AboutText;
}

/** Replaces all texts and returns the values saved by the server (trimmed). */
export async function updateAboutText({
  csrfToken,
  text,
}: UpdateAboutTextParams): Promise<AboutText> {
  const response = await http.put({
    path: "/about",
    body: text,
    headers: {
      "X-CSRF-Token": csrfToken,
    },
    schema: aboutTextResponseSchema,
  });

  return response.text;
}
