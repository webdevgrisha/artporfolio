import { queryOptions } from "@tanstack/react-query";

import { http, type Tagged } from "@/shared/api/http";

import { type ContactLinks, contactLinksSchema } from "../model/contactLinks";

interface ReplaceContactLinksParams {
  /** The ETag of the links the new ones were made from. */
  etag: string;
  links: ContactLinks;
}

/** The contact links with their ETag. A save puts the saved links here. */
export const contactLinksQuery = queryOptions({
  queryFn: (): Promise<Tagged<ContactLinks>> =>
    http.getWithETag({ path: "/contacts/links", schema: contactLinksSchema }),
  queryKey: ["contacts", "links"],
});

/**
 * Replaces all links and returns the values saved by the server (trimmed) with their new ETag.
 * Rejected with 412 when the links have changed since `etag` was read, for example in another tab.
 */
export function replaceContactLinks({
  etag,
  links,
}: ReplaceContactLinksParams): Promise<Tagged<ContactLinks>> {
  return http.putIfMatch({
    path: "/contacts/links",
    body: links,
    etag,
    schema: contactLinksSchema,
  });
}
