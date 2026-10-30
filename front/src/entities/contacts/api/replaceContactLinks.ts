import { http, type Tagged } from "@/shared/api/http";

import { type ContactLinks, contactLinksResponseSchema } from "../model/contactLinks";

interface ReplaceContactLinksParams {
  /** The ETag of the links the new ones were made from. */
  etag: string;
  links: ContactLinks;
}

/**
 * Replaces all links and returns the values saved by the server (trimmed) with their new ETag.
 * Rejected with 412 when the links have changed since `etag` was read, for example in another tab.
 */
export async function replaceContactLinks({
  etag,
  links,
}: ReplaceContactLinksParams): Promise<Tagged<ContactLinks>> {
  const { data, etag: savedEtag } = await http.putIfMatch({
    path: "/contacts/links",
    body: links,
    etag,
    schema: contactLinksResponseSchema,
  });

  return { data: data.links, etag: savedEtag };
}
