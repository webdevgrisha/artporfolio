import { http, type Tagged } from "@/shared/api/http";
import type { TranslationsBody } from "@/shared/api/translations";

import { type AboutText, aboutTextSchema } from "../model/aboutText";

interface ReplaceAboutTextParams {
  /** The ETag of the texts the new ones were made from. */
  etag: string;
  text: Omit<AboutText, "translations"> & {
    /** The texts in the other languages; the server makes those sent as null. */
    translations: TranslationsBody;
  };
}

/**
 * Replaces all texts and returns the values saved by the server (trimmed) with their new ETag.
 * Rejected with 412 when the texts have changed since `etag` was read, for example in another tab.
 */
export function replaceAboutText({
  etag,
  text,
}: ReplaceAboutTextParams): Promise<Tagged<AboutText>> {
  return http.putIfMatch({
    path: "/about/text",
    body: text,
    etag,
    schema: aboutTextSchema,
  });
}
