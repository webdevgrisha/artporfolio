import { http, type Tagged } from "@/shared/api/http";

import { type AboutText, aboutTextResponseSchema } from "../model/aboutText";

interface ReplaceAboutTextParams {
  /** The ETag of the texts the new ones were made from. */
  etag: string;
  text: AboutText;
}

/**
 * Replaces all texts and returns the values saved by the server (trimmed) with their new ETag.
 * Rejected with 412 when the texts have changed since `etag` was read, for example in another tab.
 */
export async function replaceAboutText({
  etag,
  text,
}: ReplaceAboutTextParams): Promise<Tagged<AboutText>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: "/about/text",
    body: text,
    etag,
    schema: aboutTextResponseSchema,
  });

  return { data: data.text, etag: savedEtag };
}
