import { http, type Tagged } from "@/shared/api/http";

import { type ContactLinks, contactLinksResponseSchema } from "../model/contactLinks";

interface GetContactLinksParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

/** The links with their ETag, which a replacement of the links sends back. */
export async function getContactLinks({
  signal,
}: GetContactLinksParams): Promise<Tagged<ContactLinks>> {
  const { data, etag } = await http.getWithETag({
    path: "/contacts/links",
    schema: contactLinksResponseSchema,
    signal,
  });

  return { data: data.links, etag };
}
