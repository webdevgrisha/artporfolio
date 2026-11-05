import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";

import { type AboutText, aboutTextSchema } from "../model/aboutText";

interface ReplaceAboutTextParams {
  /** The ETag of the texts the new ones were made from. */
  etag: string;
  text: AboutText;
}

/** The About texts with their ETag. A save puts the saved texts here. */
export const aboutTextQuery = queryOptions({
  queryFn: (): Promise<Tagged<AboutText>> =>
    http.getWithETag({ path: "/about/text", schema: aboutTextSchema }),
  queryKey: ["about", "text"],
});

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
