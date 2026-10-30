import { http } from "@/shared/api/http";

import { type AboutText, aboutTextResponseSchema } from "../model/aboutText";

interface ReplaceAboutTextParams {
  text: AboutText;
}

/** Replaces all texts and returns the values saved by the server (trimmed). */
export async function replaceAboutText({ text }: ReplaceAboutTextParams): Promise<AboutText> {
  const response = await http.put({
    path: "/about/text",
    body: text,
    schema: aboutTextResponseSchema,
  });

  return response.text;
}
