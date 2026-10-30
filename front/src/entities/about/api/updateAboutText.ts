import { http } from "@/shared/api/http";

import { type AboutText, aboutTextResponseSchema } from "../model/aboutText";

interface UpdateAboutTextParams {
  text: AboutText;
}

/** Replaces all texts and returns the values saved by the server (trimmed). */
export async function updateAboutText({ text }: UpdateAboutTextParams): Promise<AboutText> {
  const response = await http.put({
    path: "/about",
    body: text,
    schema: aboutTextResponseSchema,
  });

  return response.text;
}
