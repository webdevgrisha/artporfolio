import { http, type Tagged } from "@/shared/api/http";

import { type ContactLinks, contactLinksSchema } from "../model/contactLinks";

interface GetContactLinksParams {
  /** Cancels the request, e.g. when its query is cancelled. */
  signal: AbortSignal;
}

/** The links with their ETag, which a replacement of the links sends back. */
export function getContactLinks({ signal }: GetContactLinksParams): Promise<Tagged<ContactLinks>> {
  return http.getWithETag({
    path: "/contacts/links",
    schema: contactLinksSchema,
    signal,
  });
}
